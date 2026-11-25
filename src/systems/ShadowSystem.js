import { PALETTE } from '../constants/Palette.js';
import { getSunElevation } from '../entities/SunDial.js';

/**
 * Robust 2D shadow projection system.
 * Casts real-time shadow polygons opposite the light source (miniature sun).
 */
export class ShadowSystem {
  constructor(scene) {
    this.scene = scene;
    this.shadowGraphics = scene.add.graphics();
    this.casters = [];
    this.shadowPolygons = []; // Array of polygon vertex arrays for hit testing
    this.shadowOwners = []; // Parallel array of owning casters
    this.shadowLength = 650;
  }

  addCaster(caster) {
    this.casters.push(caster);
  }

  /**
   * Computes geometry for all active shadow casters and renders the shadow layer.
   * Returns calculated polygon geometries so geometry remains separate from Phaser rendering.
   * @param {number} sunX - Sun X coordinate
   * @param {number} sunY - Sun Y coordinate
   * @returns {Array<Array<{x: number, y: number}>>} Array of shadow polygons
   */
  update(sunX, sunY) {
    this.shadowPolygons = [];
    this.shadowOwners = [];

    for (const caster of this.casters) {
      const vertices = caster.getFootprintVertices();
      if (!vertices || vertices.length < 3) continue;

      const poly = this.calculateConvexShadowPolygon(vertices, sunX, sunY, caster);
      if (poly && poly.length >= 3) {
        this.shadowPolygons.push(poly);
        this.shadowOwners.push(caster);
      }
    }

    this.render();
    return this.shadowPolygons;
  }

  /**
   * Renders shadow geometry onto the designated Phaser graphics object.
   * Keeps shadow rendering modular and separate from pure geometry evaluation.
   * @param {Phaser.GameObjects.Graphics} [graphics=this.shadowGraphics]
   */
  render(graphics = this.shadowGraphics) {
    if (!graphics) return;
    graphics.clear();

    const hc = this.scene && this.scene.settings && this.scene.settings.highContrast;
    const alpha = hc ? Math.min(0.85, PALETTE.shadowAlpha + 0.2) : PALETTE.shadowAlpha;
    // Cool indigo gouache shadow tint
    graphics.fillStyle(PALETTE.shadowIndigo, alpha);
    graphics.lineStyle(hc ? 2.5 : 1.5, hc ? 0x2A355C : 0x1E2647, hc ? 0.95 : alpha * 0.85);

    for (const poly of this.shadowPolygons) {
      if (!poly || poly.length < 3) continue;
      graphics.beginPath();
      graphics.moveTo(poly[0].x, poly[0].y);
      for (let i = 1; i < poly.length; i++) {
        graphics.lineTo(poly[i].x, poly[i].y);
      }
      graphics.closePath();
      graphics.fillPath();
      graphics.strokePath();
    }
  }

  getShadowPolygons() {
    return this.shadowPolygons;
  }

  /**
   * Projects a convex polygon away from the light source without self-intersections.
   * Calculates silhouette vertices, dynamic elevation length, and proper vertex ordering.
   * @param {Array<{x: number, y: number}>} vertices - Caster footprint vertices
   * @param {number} sunX - Light source X coordinate
   * @param {number} sunY - Light source Y coordinate
   * @param {object} [caster=null] - Owning caster entity for height and tuning
   * @returns {Array<{x: number, y: number}>|null} Valid non-intersecting shadow polygon
   */
  calculateConvexShadowPolygon(vertices, sunX, sunY, caster = null) {
    if (!vertices || vertices.length < 3) return null;

    const n = vertices.length;

    // 1. Ensure consistent clockwise winding order
    let signedArea = 0;
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      signedArea += (vertices[i].x * vertices[next].y - vertices[next].x * vertices[i].y);
    }
    const verts = signedArea < 0 ? [...vertices].reverse() : vertices;

    // 2. Account for caster height, multiplier, and sun elevation
    const casterHeight = (caster && caster.height) || (caster && caster.radius ? caster.radius * 1.5 : 70);
    const lengthMult = (caster && caster.shadowLengthMultiplier) || (typeof caster === 'number' ? caster : 1.0);

    const centerX = this.scene && this.scene.centerX ? this.scene.centerX : 400;
    const centerY = this.scene && this.scene.centerY ? this.scene.centerY : 300;
    const sunAngle = Math.atan2(sunY - centerY, sunX - centerX);
    const sunElevation = getSunElevation(sunAngle);
    const len = Math.min(320, Math.max(90, (casterHeight * 1.35 * lengthMult) / sunElevation));

    // 3. Determine front-facing vs back-facing edges from sun viewpoint
    // For clockwise polygon: cross < 0 -> faces sun; cross >= 0 -> faces away from sun
    const edgeFacesAway = [];
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      const v1 = verts[i];
      const v2 = verts[next];
      const cross = (v2.x - v1.x) * (sunY - v1.y) - (v2.y - v1.y) * (sunX - v1.x);
      edgeFacesAway.push(cross >= 0);
    }

    // 4. Find silhouette transition vertices
    let startIndex = -1; // Transitions from front-facing to back-facing
    let endIndex = -1;   // Transitions from back-facing to front-facing

    for (let i = 0; i < n; i++) {
      const prevEdge = (i - 1 + n) % n;
      const currEdge = i;
      if (!edgeFacesAway[prevEdge] && edgeFacesAway[currEdge]) {
        startIndex = i;
      }
      if (edgeFacesAway[prevEdge] && !edgeFacesAway[currEdge]) {
        endIndex = i;
      }
    }

    // Robust fallback for collinear or degenerate edge configurations
    if (startIndex === -1 || endIndex === -1 || startIndex === endIndex) {
      let minSpan = Infinity;
      let maxSpan = -Infinity;
      for (let i = 0; i < n; i++) {
        const dx = verts[i].x - sunX;
        const dy = verts[i].y - sunY;
        const proj = dx * Math.cos(sunAngle + Math.PI / 2) + dy * Math.sin(sunAngle + Math.PI / 2);
        if (proj < minSpan) { minSpan = proj; startIndex = i; }
        if (proj > maxSpan) { maxSpan = proj; endIndex = i; }
      }
    }

    if (startIndex === -1 || endIndex === -1 || startIndex === endIndex) return null;

    const vStart = verts[startIndex];
    const vEnd = verts[endIndex];

    // 5. Compute projected ray extrema safely (handling parallel / degenerate zero-length vectors)
    const dStartX = vStart.x - sunX;
    const dStartY = vStart.y - sunY;
    const distStart = Math.hypot(dStartX, dStartY);
    const uStartX = distStart > 1e-4 ? dStartX / distStart : Math.cos(sunAngle);
    const uStartY = distStart > 1e-4 ? dStartY / distStart : Math.sin(sunAngle);

    const pStart = {
      x: vStart.x + uStartX * len,
      y: vStart.y + uStartY * len
    };

    const dEndX = vEnd.x - sunX;
    const dEndY = vEnd.y - sunY;
    const distEnd = Math.hypot(dEndX, dEndY);
    const uEndX = distEnd > 1e-4 ? dEndX / distEnd : Math.cos(sunAngle);
    const uEndY = distEnd > 1e-4 ? dEndY / distEnd : Math.sin(sunAngle);

    const pEnd = {
      x: vEnd.x + uEndX * len,
      y: vEnd.y + uEndY * len
    };

    // 6. Build non-self-intersecting closed polygon:
    // vStart -> clockwise along back vertices -> vEnd -> pEnd -> pStart -> vStart
    const poly = [];
    poly.push({ x: vStart.x, y: vStart.y });

    let curr = startIndex;
    let safety = 0;
    while (curr !== endIndex && safety++ < n + 2) {
      curr = (curr + 1) % n;
      poly.push({ x: verts[curr].x, y: verts[curr].y });
    }

    poly.push(pEnd);
    poly.push(pStart);

    return poly;
  }

  destroy() {
    if (this.shadowGraphics) {
      this.shadowGraphics.destroy();
      this.shadowGraphics = null;
    }
    this.casters = [];
    this.shadowPolygons = [];
  }

  /**
   * Evaluates if a given world coordinate is in shadow.
   * Tests point-in-polygon against all active shadow hulls,
   * plus a direct raycast segment intersection test with casters.
   */
  isPointInShadow(x, y, sunX, sunY, ignoreCaster = null) {
    // 1. Point inside any shadow polygon (skip the one owned by ignoreCaster)
    for (let i = 0; i < this.shadowPolygons.length; i++) {
      if (ignoreCaster && this.shadowOwners[i] === ignoreCaster) continue;
      if (this.pointInPolygon(x, y, this.shadowPolygons[i])) {
        return true;
      }
    }

    // 2. Direct raycast check from Sun to Point (occlusion check)
    for (const caster of this.casters) {
      if (ignoreCaster && caster === ignoreCaster) continue;
      const vertices = caster.getFootprintVertices();
      if (!vertices) continue;
      if (this.lineIntersectsPolygon(sunX, sunY, x, y, vertices)) {
        return true;
      }
    }

    return false;
  }

  pointInPolygon(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y;
      const xj = poly[j].x, yj = poly[j].y;

      const intersect = ((yi > y) !== (yj > y)) &&
        (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  lineIntersectsPolygon(x1, y1, x2, y2, poly) {
    for (let i = 0; i < poly.length; i++) {
      const next = (i + 1) % poly.length;
      if (this.lineIntersectsLine(x1, y1, x2, y2, poly[i].x, poly[i].y, poly[next].x, poly[next].y)) {
        return true;
      }
    }
    return false;
  }

  lineIntersectsLine(a1x, a1y, a2x, a2y, b1x, b1y, b2x, b2y) {
    const denom = (b2y - b1y) * (a2x - a1x) - (b2x - b1x) * (a2y - a1y);
    if (denom === 0) return false;
    const ua = ((b2x - b1x) * (a1y - b1y) - (b2y - b1y) * (a1x - b1x)) / denom;
    const ub = ((a2x - a1x) * (a1y - b1y) - (a2y - a1y) * (a1x - b1x)) / denom;
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }
}
