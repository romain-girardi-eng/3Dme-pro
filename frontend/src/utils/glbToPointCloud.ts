/**
 * glbToPointCloud.ts
 *
 * Converts GLB 3D models to high-fidelity point cloud data.
 * Uses surface sampling (not just vertices) for better detail preservation.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface PointCloudData {
  positions: Float32Array;
  colors: Float32Array;
  normals: Float32Array;
  sizes: Float32Array;  // Variable size per particle for detail preservation
  count: number;
}

/**
 * Model analysis result for intelligent particle count estimation
 */
export interface ModelAnalysis {
  vertexCount: number;
  faceCount: number;
  meshCount: number;
  totalSurfaceArea: number;
  boundingBoxVolume: number;
  boundingBoxDimensions: { x: number; y: number; z: number };
  recommendedParticles: number;
  minParticles: number;
  maxParticles: number;
  complexityScore: number; // 0-100
}

/**
 * Analyze a GLB file to determine optimal particle count
 * This is a fast pre-analysis before the full conversion
 */
export async function analyzeGLB(glbUrl: string): Promise<ModelAnalysis> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();

    loader.load(
      glbUrl,
      (gltf) => {
        try {
          let vertexCount = 0;
          let faceCount = 0;
          let meshCount = 0;
          let totalSurfaceArea = 0;

          // Bounding box calculation
          let minX = Infinity, minY = Infinity, minZ = Infinity;
          let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

          const v0 = new THREE.Vector3();
          const v1 = new THREE.Vector3();
          const v2 = new THREE.Vector3();

          gltf.scene.traverse((child: any) => {
            if (child.isMesh && child.geometry) {
              meshCount++;
              child.updateMatrixWorld(true);

              const geometry = child.geometry;
              const posAttr = geometry.attributes.position;
              const indexAttr = geometry.index;

              vertexCount += posAttr.count;
              faceCount += indexAttr ? indexAttr.count / 3 : posAttr.count / 3;

              // Calculate surface area and bounding box
              const processTriangle = (i0: number, i1: number, i2: number) => {
                v0.fromBufferAttribute(posAttr, i0).applyMatrix4(child.matrixWorld);
                v1.fromBufferAttribute(posAttr, i1).applyMatrix4(child.matrixWorld);
                v2.fromBufferAttribute(posAttr, i2).applyMatrix4(child.matrixWorld);

                // Update bounding box
                [v0, v1, v2].forEach(v => {
                  minX = Math.min(minX, v.x);
                  minY = Math.min(minY, v.y);
                  minZ = Math.min(minZ, v.z);
                  maxX = Math.max(maxX, v.x);
                  maxY = Math.max(maxY, v.y);
                  maxZ = Math.max(maxZ, v.z);
                });

                // Calculate triangle area
                const ab = new THREE.Vector3().subVectors(v1, v0);
                const ac = new THREE.Vector3().subVectors(v2, v0);
                return ab.cross(ac).length() * 0.5;
              };

              if (indexAttr) {
                for (let i = 0; i < indexAttr.count; i += 3) {
                  totalSurfaceArea += processTriangle(
                    indexAttr.getX(i),
                    indexAttr.getX(i + 1),
                    indexAttr.getX(i + 2)
                  );
                }
              } else {
                for (let i = 0; i < posAttr.count; i += 3) {
                  totalSurfaceArea += processTriangle(i, i + 1, i + 2);
                }
              }
            }
          });

          // Calculate bounding box dimensions and volume
          const dimX = maxX - minX;
          const dimY = maxY - minY;
          const dimZ = maxZ - minZ;
          const volume = dimX * dimY * dimZ;

          // Intelligent particle count estimation
          // Based on: surface area, vertex density, and model complexity

          // Base calculation: aim for ~1000-2000 particles per unit of surface area
          const baseParticles = totalSurfaceArea * 1500;

          // Adjust based on vertex count (more vertices = need more particles)
          const vertexAdjustment = Math.min(vertexCount / 10, 500000);

          // Complexity score (0-100)
          const complexityScore = Math.min(100, Math.round(
            (Math.log10(vertexCount + 1) * 10) +
            (Math.log10(faceCount + 1) * 10) +
            (meshCount * 2) +
            (Math.log10(totalSurfaceArea + 1) * 5)
          ));

          // Recommended particles based on complexity
          // NO ARTIFICIAL LIMITS - let the user push as high as their hardware allows
          let recommendedParticles: number;

          if (complexityScore < 20) {
            // Simple model (basic shapes)
            recommendedParticles = Math.max(50000, Math.min(200000, baseParticles));
          } else if (complexityScore < 40) {
            // Low complexity
            recommendedParticles = Math.max(100000, Math.min(400000, baseParticles));
          } else if (complexityScore < 60) {
            // Medium complexity
            recommendedParticles = Math.max(300000, Math.min(800000, baseParticles + vertexAdjustment * 0.5));
          } else if (complexityScore < 80) {
            // High complexity
            recommendedParticles = Math.max(500000, Math.min(1500000, baseParticles + vertexAdjustment * 0.7));
          } else {
            // Very high complexity (like your owl with 1.38M vertices)
            // With texture sampling + adaptive density, we can preserve MAXIMUM detail
            recommendedParticles = Math.max(800000, Math.min(3000000, baseParticles + vertexAdjustment));
          }

          // Round to nice numbers
          recommendedParticles = Math.round(recommendedParticles / 10000) * 10000;

          // Min/max bounds - NO UPPER LIMIT, let the user decide based on their hardware
          const minParticles = Math.max(50000, Math.round(recommendedParticles * 0.2 / 10000) * 10000);
          // Max is 3x recommended or at least 5M for complex models (hardware permitting)
          const maxParticles = Math.max(5000000, Math.round(recommendedParticles * 3 / 10000) * 10000);

          const analysis: ModelAnalysis = {
            vertexCount,
            faceCount,
            meshCount,
            totalSurfaceArea,
            boundingBoxVolume: volume,
            boundingBoxDimensions: { x: dimX, y: dimY, z: dimZ },
            recommendedParticles,
            minParticles,
            maxParticles,
            complexityScore,
          };

          console.log('Model Analysis:', analysis);
          resolve(analysis);
        } catch (error) {
          reject(error);
        }
      },
      undefined,
      (error) => {
        reject(new Error(`Failed to load GLB for analysis: ${error}`));
      }
    );
  });
}

/**
 * Load a GLB file and extract high-fidelity point cloud data
 */
export async function loadGLBAsPointCloud(
  glbUrl: string,
  targetPointCount: number = 100000  // Increased default for better detail
): Promise<PointCloudData> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();

    loader.load(
      glbUrl,
      (gltf) => {
        try {
          const pointCloud = extractPointCloudFromGLTF(gltf, targetPointCount);
          resolve(pointCloud);
        } catch (error) {
          reject(error);
        }
      },
      undefined,
      (error) => {
        reject(new Error(`Failed to load GLB: ${error}`));
      }
    );
  });
}

/**
 * Calculate triangle area
 */
function triangleArea(v0: THREE.Vector3, v1: THREE.Vector3, v2: THREE.Vector3): number {
  const ab = new THREE.Vector3().subVectors(v1, v0);
  const ac = new THREE.Vector3().subVectors(v2, v0);
  return ab.cross(ac).length() * 0.5;
}

/**
 * Calculate triangle normal
 */
function triangleNormal(
  v0: THREE.Vector3,
  v1: THREE.Vector3,
  v2: THREE.Vector3,
  target: THREE.Vector3
): void {
  const ab = new THREE.Vector3().subVectors(v1, v0);
  const ac = new THREE.Vector3().subVectors(v2, v0);
  target.crossVectors(ab, ac).normalize();
}

interface MeshData {
  geometry: THREE.BufferGeometry;
  worldMatrix: THREE.Matrix4;
  color: THREE.Color;
  totalArea: number;
  // Texture data for color sampling
  texture?: {
    data: Uint8Array | Uint8ClampedArray;
    width: number;
    height: number;
  };
  hasUVs: boolean;
  hasVertexColors: boolean;
  // Vertex colors from the geometry (if available)
  vertexColors?: THREE.BufferAttribute;
  // Pre-computed detail weights for adaptive density
  triangleWeights?: Float32Array; // Weight per triangle based on curvature/detail
  totalWeight: number;
}

/**
 * Extract texture pixel data from a THREE.Texture
 */
function extractTextureData(texture: THREE.Texture): { data: Uint8ClampedArray; width: number; height: number } | null {
  try {
    const image = texture.image;
    if (!image) return null;

    // Create canvas to read pixel data
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Handle different image types
    let width: number, height: number;
    let drawableImage: CanvasImageSource;

    if (image instanceof HTMLImageElement) {
      width = image.naturalWidth || image.width;
      height = image.naturalHeight || image.height;
      drawableImage = image;
    } else if (image instanceof ImageBitmap) {
      width = image.width;
      height = image.height;
      drawableImage = image;
    } else if (image instanceof HTMLCanvasElement) {
      width = image.width;
      height = image.height;
      drawableImage = image;
    } else if (image instanceof HTMLVideoElement) {
      width = image.videoWidth;
      height = image.videoHeight;
      drawableImage = image;
    } else {
      // Unknown image type
      return null;
    }

    if (width === 0 || height === 0) return null;

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(drawableImage, 0, 0);

    const imageData = ctx.getImageData(0, 0, width, height);
    console.log(`Extracted texture: ${width}x${height} (${(imageData.data.length / 1024 / 1024).toFixed(1)}MB)`);

    return {
      data: imageData.data,
      width,
      height
    };
  } catch (e) {
    console.warn('Failed to extract texture data:', e);
    return null;
  }
}

/**
 * Sample texture color at UV coordinates using bilinear interpolation
 */
function sampleTextureAt(
  textureData: { data: Uint8Array | Uint8ClampedArray; width: number; height: number },
  u: number,
  v: number
): THREE.Color {
  // Wrap UV coordinates
  u = ((u % 1) + 1) % 1;
  v = ((v % 1) + 1) % 1;

  // Flip V coordinate (texture coordinates are bottom-up)
  v = 1 - v;

  // Get pixel coordinates
  const x = u * (textureData.width - 1);
  const y = v * (textureData.height - 1);

  // Bilinear interpolation
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, textureData.width - 1);
  const y1 = Math.min(y0 + 1, textureData.height - 1);

  const fx = x - x0;
  const fy = y - y0;

  // Get pixel indices (RGBA = 4 bytes per pixel)
  const idx00 = (y0 * textureData.width + x0) * 4;
  const idx10 = (y0 * textureData.width + x1) * 4;
  const idx01 = (y1 * textureData.width + x0) * 4;
  const idx11 = (y1 * textureData.width + x1) * 4;

  // Bilinear interpolation for each channel
  const r = (
    textureData.data[idx00] * (1 - fx) * (1 - fy) +
    textureData.data[idx10] * fx * (1 - fy) +
    textureData.data[idx01] * (1 - fx) * fy +
    textureData.data[idx11] * fx * fy
  ) / 255;

  const g = (
    textureData.data[idx00 + 1] * (1 - fx) * (1 - fy) +
    textureData.data[idx10 + 1] * fx * (1 - fy) +
    textureData.data[idx01 + 1] * (1 - fx) * fy +
    textureData.data[idx11 + 1] * fx * fy
  ) / 255;

  const b = (
    textureData.data[idx00 + 2] * (1 - fx) * (1 - fy) +
    textureData.data[idx10 + 2] * fx * (1 - fy) +
    textureData.data[idx01 + 2] * (1 - fx) * fy +
    textureData.data[idx11 + 2] * fx * fy
  ) / 255;

  return new THREE.Color(r, g, b);
}

/**
 * Calculate curvature at a vertex by comparing face normals
 * Higher curvature = more detail = needs more particles
 */
function calculateTriangleCurvature(
  n0: THREE.Vector3,
  n1: THREE.Vector3,
  n2: THREE.Vector3
): number {
  // Compare vertex normals to detect curvature
  const dot01 = Math.abs(n0.dot(n1));
  const dot12 = Math.abs(n1.dot(n2));
  const dot20 = Math.abs(n2.dot(n0));

  // Average of normal differences (1 = flat, 0 = high curvature)
  const avgDot = (dot01 + dot12 + dot20) / 3;

  // Invert: high curvature areas get higher values
  return 1 - avgDot;
}

/**
 * Calculate texture detail/variance at a UV region
 */
function calculateTextureDetail(
  textureData: { data: Uint8ClampedArray; width: number; height: number },
  uv0: { x: number; y: number },
  uv1: { x: number; y: number },
  uv2: { x: number; y: number }
): number {
  // Sample texture at triangle center and corners
  const centerU = (uv0.x + uv1.x + uv2.x) / 3;
  const centerV = (uv0.y + uv1.y + uv2.y) / 3;

  const getPixel = (u: number, v: number) => {
    u = ((u % 1) + 1) % 1;
    v = ((v % 1) + 1) % 1;
    v = 1 - v;
    const x = Math.floor(u * (textureData.width - 1));
    const y = Math.floor(v * (textureData.height - 1));
    const idx = (y * textureData.width + x) * 4;
    return {
      r: textureData.data[idx] / 255,
      g: textureData.data[idx + 1] / 255,
      b: textureData.data[idx + 2] / 255,
    };
  };

  const center = getPixel(centerU, centerV);
  const c0 = getPixel(uv0.x, uv0.y);
  const c1 = getPixel(uv1.x, uv1.y);
  const c2 = getPixel(uv2.x, uv2.y);

  // Calculate variance from center
  const variance = (
    Math.abs(c0.r - center.r) + Math.abs(c0.g - center.g) + Math.abs(c0.b - center.b) +
    Math.abs(c1.r - center.r) + Math.abs(c1.g - center.g) + Math.abs(c1.b - center.b) +
    Math.abs(c2.r - center.r) + Math.abs(c2.g - center.g) + Math.abs(c2.b - center.b)
  ) / 9;

  return variance;
}

/**
 * Extract point cloud data from a loaded GLTF scene using surface sampling
 * with TEXTURE COLOR SAMPLING and ADAPTIVE DENSITY for maximum detail
 */
function extractPointCloudFromGLTF(
  gltf: any,
  targetPointCount: number
): PointCloudData {
  const meshes: MeshData[] = [];
  let totalSurfaceArea = 0;
  let totalWeightedArea = 0;
  let texturesExtracted = 0;
  let vertexColorsFound = 0;

  // First pass: collect all meshes, calculate surface areas, curvature weights, and extract textures
  gltf.scene.traverse((child: any) => {
    if (child.isMesh && child.geometry) {
      child.updateMatrixWorld(true);

      // Get material color as fallback
      let materialColor = new THREE.Color(0xaaaaaa);
      if (child.material?.color) {
        materialColor = child.material.color.clone();
      }

      // Try to extract texture data for color sampling
      let textureData: { data: Uint8ClampedArray; width: number; height: number } | undefined;

      if (child.material) {
        // Check for base color texture (PBR workflow)
        const material = child.material;
        let colorTexture: THREE.Texture | null = null;

        // Try different texture sources in order of preference
        if (material.map) {
          colorTexture = material.map;
        } else if (material.emissiveMap) {
          colorTexture = material.emissiveMap;
        } else if (material.aoMap) {
          colorTexture = material.aoMap;
        }

        if (colorTexture) {
          const extracted = extractTextureData(colorTexture);
          if (extracted) {
            textureData = extracted;
            texturesExtracted++;
          }
        }
      }

      // Calculate total surface area and curvature weights of this mesh
      const geometry = child.geometry;
      const posAttr = geometry.attributes.position;
      const normalAttr = geometry.attributes.normal;
      const uvAttr = geometry.attributes.uv;
      const colorAttr = geometry.attributes.color; // Vertex colors
      const indexAttr = geometry.index;

      // Check for vertex colors
      const hasVertexColors = !!colorAttr;
      if (hasVertexColors) {
        vertexColorsFound++;
      }

      let meshArea = 0;
      let meshWeight = 0;
      const triangleCount = indexAttr ? indexAttr.count / 3 : posAttr.count / 3;
      const triangleWeights = new Float32Array(triangleCount);

      const v0 = new THREE.Vector3();
      const v1 = new THREE.Vector3();
      const v2 = new THREE.Vector3();
      const n0 = new THREE.Vector3();
      const n1 = new THREE.Vector3();
      const n2 = new THREE.Vector3();

      const normalMatrix = new THREE.Matrix3().getNormalMatrix(child.matrixWorld);

      const processTriangle = (idx: number, i0: number, i1: number, i2: number) => {
        v0.fromBufferAttribute(posAttr, i0).applyMatrix4(child.matrixWorld);
        v1.fromBufferAttribute(posAttr, i1).applyMatrix4(child.matrixWorld);
        v2.fromBufferAttribute(posAttr, i2).applyMatrix4(child.matrixWorld);

        const area = triangleArea(v0, v1, v2);
        if (area <= 0) {
          triangleWeights[idx] = 0;
          return 0;
        }

        // Calculate curvature weight from vertex normals
        let curvatureWeight = 0;
        if (normalAttr) {
          n0.fromBufferAttribute(normalAttr, i0).applyNormalMatrix(normalMatrix).normalize();
          n1.fromBufferAttribute(normalAttr, i1).applyNormalMatrix(normalMatrix).normalize();
          n2.fromBufferAttribute(normalAttr, i2).applyNormalMatrix(normalMatrix).normalize();
          curvatureWeight = calculateTriangleCurvature(n0, n1, n2);
        }

        // Calculate texture detail weight
        let textureWeight = 0;
        if (textureData && uvAttr) {
          const uv0 = { x: uvAttr.getX(i0), y: uvAttr.getY(i0) };
          const uv1 = { x: uvAttr.getX(i1), y: uvAttr.getY(i1) };
          const uv2 = { x: uvAttr.getX(i2), y: uvAttr.getY(i2) };
          textureWeight = calculateTextureDetail(textureData, uv0, uv1, uv2);
        }

        // Combined weight: base area + curvature bonus + texture detail bonus
        // Areas with high curvature or texture detail get more particles
        const detailBonus = 1 + (curvatureWeight * 2) + (textureWeight * 1.5);
        const weight = area * detailBonus;

        triangleWeights[idx] = weight;
        meshWeight += weight;
        meshArea += area;

        return area;
      };

      if (indexAttr) {
        for (let i = 0; i < indexAttr.count; i += 3) {
          processTriangle(
            i / 3,
            indexAttr.getX(i),
            indexAttr.getX(i + 1),
            indexAttr.getX(i + 2)
          );
        }
      } else {
        for (let i = 0; i < posAttr.count; i += 3) {
          processTriangle(i / 3, i, i + 1, i + 2);
        }
      }

      if (meshArea > 0) {
        meshes.push({
          geometry: geometry,
          worldMatrix: child.matrixWorld.clone(),
          color: materialColor,
          totalArea: meshArea,
          texture: textureData,
          hasUVs: !!uvAttr,
          hasVertexColors,
          vertexColors: colorAttr,
          triangleWeights,
          totalWeight: meshWeight,
        });
        totalSurfaceArea += meshArea;
        totalWeightedArea += meshWeight;
      }
    }
  });

  if (meshes.length === 0 || totalSurfaceArea === 0) {
    throw new Error('No valid geometry found in GLB file');
  }

  console.log(`Found ${meshes.length} meshes with total surface area: ${totalSurfaceArea.toFixed(2)}`);
  console.log(`Extracted ${texturesExtracted} textures for color sampling`);
  console.log(`Found ${vertexColorsFound} meshes with vertex colors`);
  console.log(`Weighted area (with curvature/texture detail): ${totalWeightedArea.toFixed(2)} (${((totalWeightedArea / totalSurfaceArea - 1) * 100).toFixed(1)}% boost)`);

  // NO ARTIFICIAL LIMIT - let the user decide based on their hardware
  // The system will handle it or the browser will warn about memory
  const actualPointCount = targetPointCount;
  console.log(`Allocating arrays for ${actualPointCount.toLocaleString()} points...`);

  // Allocate output arrays including sizes for variable particle sizes
  const positions = new Float32Array(actualPointCount * 3);
  const colors = new Float32Array(actualPointCount * 3);
  const normals = new Float32Array(actualPointCount * 3);
  const sizes = new Float32Array(actualPointCount); // Variable size per particle
  console.log('Arrays allocated, starting adaptive sampling...');

  // Second pass: sample points from each mesh proportional to WEIGHTED area (adaptive density)
  // Now with TEXTURE SAMPLING, VERTEX COLORS, and VARIABLE SIZES
  let pointIndex = 0;
  const tempNormal = new THREE.Vector3();
  const v0 = new THREE.Vector3();
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();

  for (const mesh of meshes) {
    // Calculate how many points this mesh should get based on WEIGHTED area (adaptive density)
    const meshPointCount = Math.floor((mesh.totalWeight / totalWeightedArea) * actualPointCount);
    if (meshPointCount === 0) continue;

    const geometry = mesh.geometry;
    const posAttr = geometry.attributes.position;
    const uvAttr = geometry.attributes.uv;
    const indexAttr = geometry.index;

    const hasTexture = mesh.texture && mesh.hasUVs && uvAttr;
    const hasVertexColors = mesh.hasVertexColors && mesh.vertexColors;

    if (hasTexture) {
      console.log(`Mesh has texture (${mesh.texture!.width}x${mesh.texture!.height}) - using texture sampling`);
    }
    if (hasVertexColors) {
      console.log(`Mesh has vertex colors - using vertex color sampling`);
    }

    // Build array of triangles with cumulative WEIGHT for adaptive sampling
    const triangles: { i0: number; i1: number; i2: number; cumulativeWeight: number; triangleIdx: number }[] = [];
    let cumulativeWeight = 0;

    if (indexAttr) {
      for (let i = 0; i < indexAttr.count; i += 3) {
        const triangleIdx = i / 3;
        const weight = mesh.triangleWeights![triangleIdx];
        if (weight <= 0) continue;

        cumulativeWeight += weight;
        triangles.push({
          i0: indexAttr.getX(i),
          i1: indexAttr.getX(i + 1),
          i2: indexAttr.getX(i + 2),
          cumulativeWeight,
          triangleIdx,
        });
      }
    } else {
      for (let i = 0; i < posAttr.count; i += 3) {
        const triangleIdx = i / 3;
        const weight = mesh.triangleWeights![triangleIdx];
        if (weight <= 0) continue;

        cumulativeWeight += weight;
        triangles.push({
          i0: i,
          i1: i + 1,
          i2: i + 2,
          cumulativeWeight,
          triangleIdx,
        });
      }
    }

    // Binary search helper for faster triangle selection by weight
    const findTriangleByWeight = (targetWeight: number): typeof triangles[0] => {
      let low = 0;
      let high = triangles.length - 1;
      while (low < high) {
        const mid = (low + high) >>> 1;
        if (triangles[mid].cumulativeWeight < targetWeight) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }
      return triangles[low];
    };

    // Sample points using WEIGHT-based random selection (adaptive density)
    for (let p = 0; p < meshPointCount && pointIndex < actualPointCount; p++) {
      // Select triangle weighted by detail weight using binary search
      const r = Math.random() * cumulativeWeight;
      const selectedTriangle = findTriangleByWeight(r);

      // Get triangle vertices in world space
      v0.fromBufferAttribute(posAttr, selectedTriangle.i0).applyMatrix4(mesh.worldMatrix);
      v1.fromBufferAttribute(posAttr, selectedTriangle.i1).applyMatrix4(mesh.worldMatrix);
      v2.fromBufferAttribute(posAttr, selectedTriangle.i2).applyMatrix4(mesh.worldMatrix);

      // Generate random barycentric coordinates
      let baryU = Math.random();
      let baryV = Math.random();
      if (baryU + baryV > 1) {
        baryU = 1 - baryU;
        baryV = 1 - baryV;
      }
      const baryW = 1 - baryU - baryV;

      // Interpolate position using barycentric coords
      const posX = v0.x * baryW + v1.x * baryU + v2.x * baryV;
      const posY = v0.y * baryW + v1.y * baryU + v2.y * baryV;
      const posZ = v0.z * baryW + v1.z * baryU + v2.z * baryV;

      // Calculate face normal
      triangleNormal(v0, v1, v2, tempNormal);

      // Store position and normal
      const idx3 = pointIndex * 3;
      positions[idx3] = posX;
      positions[idx3 + 1] = posY;
      positions[idx3 + 2] = posZ;

      normals[idx3] = tempNormal.x;
      normals[idx3 + 1] = tempNormal.y;
      normals[idx3 + 2] = tempNormal.z;

      // Calculate VARIABLE PARTICLE SIZE based on local detail
      // High-detail areas (high weight) get smaller particles, flat areas get larger
      const triangleWeight = mesh.triangleWeights![selectedTriangle.triangleIdx];

      // Size is inversely proportional to local detail weight
      // Areas with more detail (more curvature/texture variance) get smaller particles for precision
      // Flat areas get larger particles to fill space efficiently
      const detailFactor = triangleWeight / (mesh.totalWeight / triangles.length); // >1 for detailed, <1 for flat
      const sizeMultiplier = 1 / Math.sqrt(Math.max(0.5, Math.min(2, detailFactor)));
      sizes[pointIndex] = sizeMultiplier;

      // GET COLOR: Priority order: texture > vertex colors > material color
      let colorR: number, colorG: number, colorB: number;

      if (hasTexture && uvAttr) {
        // Get UV coordinates for each vertex
        const uv0x = uvAttr.getX(selectedTriangle.i0);
        const uv0y = uvAttr.getY(selectedTriangle.i0);
        const uv1x = uvAttr.getX(selectedTriangle.i1);
        const uv1y = uvAttr.getY(selectedTriangle.i1);
        const uv2x = uvAttr.getX(selectedTriangle.i2);
        const uv2y = uvAttr.getY(selectedTriangle.i2);

        // Interpolate UV using barycentric coords
        const uvU = uv0x * baryW + uv1x * baryU + uv2x * baryV;
        const uvV = uv0y * baryW + uv1y * baryU + uv2y * baryV;

        // Sample texture at interpolated UV
        const texColor = sampleTextureAt(mesh.texture!, uvU, uvV);
        colorR = texColor.r;
        colorG = texColor.g;
        colorB = texColor.b;
      } else if (hasVertexColors) {
        // Sample vertex colors using barycentric interpolation
        const vc = mesh.vertexColors!;
        const c0r = vc.getX(selectedTriangle.i0);
        const c0g = vc.getY(selectedTriangle.i0);
        const c0b = vc.getZ(selectedTriangle.i0);
        const c1r = vc.getX(selectedTriangle.i1);
        const c1g = vc.getY(selectedTriangle.i1);
        const c1b = vc.getZ(selectedTriangle.i1);
        const c2r = vc.getX(selectedTriangle.i2);
        const c2g = vc.getY(selectedTriangle.i2);
        const c2b = vc.getZ(selectedTriangle.i2);

        colorR = c0r * baryW + c1r * baryU + c2r * baryV;
        colorG = c0g * baryW + c1g * baryU + c2g * baryV;
        colorB = c0b * baryW + c1b * baryU + c2b * baryV;
      } else {
        // Fallback to material color
        colorR = mesh.color.r;
        colorG = mesh.color.g;
        colorB = mesh.color.b;
      }

      colors[idx3] = colorR;
      colors[idx3 + 1] = colorG;
      colors[idx3 + 2] = colorB;

      pointIndex++;
    }
  }

  console.log(`Sampling complete: ${pointIndex} points sampled`);

  // Fill remaining points if any (duplicate from sampled points)
  if (pointIndex > 0 && pointIndex < actualPointCount) {
    console.log(`Filling ${actualPointCount - pointIndex} remaining points by duplication`);
    const sampledCount = pointIndex;
    while (pointIndex < actualPointCount) {
      const srcIdx = pointIndex % sampledCount;
      const s3 = srcIdx * 3;
      const d3 = pointIndex * 3;

      positions[d3] = positions[s3];
      positions[d3 + 1] = positions[s3 + 1];
      positions[d3 + 2] = positions[s3 + 2];

      normals[d3] = normals[s3];
      normals[d3 + 1] = normals[s3 + 1];
      normals[d3 + 2] = normals[s3 + 2];

      colors[d3] = colors[s3];
      colors[d3 + 1] = colors[s3 + 1];
      colors[d3 + 2] = colors[s3 + 2];

      sizes[pointIndex] = sizes[srcIdx]; // Copy size too

      pointIndex++;
    }
  }

  console.log(`Generated ${actualPointCount.toLocaleString()} points from adaptive surface sampling`);

  // Normalize positions to fit in a reasonable space
  console.log('Starting position normalization...');
  normalizePositions(positions);
  console.log('Normalization complete, returning point cloud data');

  return {
    positions,
    colors,
    normals,
    sizes,
    count: actualPointCount,
  };
}

/**
 * Normalize positions to center at origin and scale to reasonable size
 */
function normalizePositions(positions: Float32Array, targetSize: number = 80): void {
  const count = positions.length / 3;

  // Find bounding box
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < count; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];

    if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      minZ = Math.min(minZ, z);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      maxZ = Math.max(maxZ, z);
    }
  }

  // Handle edge case
  if (!isFinite(minX)) {
    console.warn('No valid positions found');
    return;
  }

  // Calculate center and scale
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;
  const maxSize = Math.max(sizeX, sizeY, sizeZ);

  const scale = maxSize > 0 ? targetSize / maxSize : 1;

  // Apply transformation
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    positions[i3] = (positions[i3] - centerX) * scale;
    positions[i3 + 1] = (positions[i3 + 1] - centerY) * scale;
    positions[i3 + 2] = (positions[i3 + 2] - centerZ) * scale;
  }

  console.log(`Normalized: center=(${centerX.toFixed(2)}, ${centerY.toFixed(2)}, ${centerZ.toFixed(2)}), scale=${scale.toFixed(4)}`);
}

/**
 * Create a simple point cloud visualization from raw data
 */
export function createPointCloudMesh(data: PointCloudData): THREE.Points {
  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(data.colors, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3));

  const material = new THREE.PointsMaterial({
    size: 0.8,
    vertexColors: true,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.95,
  });

  return new THREE.Points(geometry, material);
}
