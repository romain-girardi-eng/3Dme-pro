/**
 * glbToParticles.mjs
 *
 * Convert GLB 3D model to particle point cloud data
 * Uses surface sampling for high-fidelity detail preservation
 *
 * Usage: node scripts/glbToParticles.mjs <input.glb> <output.json> [pointCount]
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import fs from 'fs';
import path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node scripts/glbToParticles.mjs <input.glb> <output.json> [pointCount]');
  console.log('Example: node scripts/glbToParticles.mjs assets/glb/owl.glb assets/particles/owl.json 150000');
  process.exit(1);
}

const inputPath = args[0];
const outputPath = args[1];
const targetPointCount = parseInt(args[2] || '150000', 10);

console.log(`\n🦉 GLB to Particles Converter`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`Input:  ${inputPath}`);
console.log(`Output: ${outputPath}`);
console.log(`Target points: ${targetPointCount.toLocaleString()}`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

// Helper functions
function triangleArea(v0, v1, v2) {
  const ab = new THREE.Vector3().subVectors(v1, v0);
  const ac = new THREE.Vector3().subVectors(v2, v0);
  return ab.cross(ac).length() * 0.5;
}

function triangleNormal(v0, v1, v2, target) {
  const ab = new THREE.Vector3().subVectors(v1, v0);
  const ac = new THREE.Vector3().subVectors(v2, v0);
  target.crossVectors(ab, ac).normalize();
}

function sampleTriangle(v0, v1, v2, target) {
  let u = Math.random();
  let v = Math.random();
  if (u + v > 1) {
    u = 1 - u;
    v = 1 - v;
  }
  const w = 1 - u - v;
  target.set(
    v0.x * w + v1.x * u + v2.x * v,
    v0.y * w + v1.y * u + v2.y * v,
    v0.z * w + v1.z * u + v2.z * v
  );
}

function interpolateColor(c0, c1, c2, u, v, w) {
  return new THREE.Color(
    c0.r * w + c1.r * u + c2.r * v,
    c0.g * w + c1.g * u + c2.g * v,
    c0.b * w + c1.b * u + c2.b * v
  );
}

// Main conversion function
async function convertGLBToParticles(glbPath, pointCount) {
  // Read GLB file
  const glbBuffer = fs.readFileSync(glbPath);
  const arrayBuffer = glbBuffer.buffer.slice(
    glbBuffer.byteOffset,
    glbBuffer.byteOffset + glbBuffer.byteLength
  );

  // Load with GLTFLoader
  const loader = new GLTFLoader();

  return new Promise((resolve, reject) => {
    loader.parse(arrayBuffer, '', (gltf) => {
      console.log('✓ GLB loaded successfully');

      const meshes = [];
      let totalSurfaceArea = 0;
      let totalVertices = 0;
      let totalFaces = 0;

      // First pass: collect all meshes and calculate surface areas
      gltf.scene.traverse((child) => {
        if (child.isMesh && child.geometry) {
          child.updateMatrixWorld(true);

          const geometry = child.geometry;
          const posAttr = geometry.attributes.position;
          const colorAttr = geometry.attributes.color;
          const indexAttr = geometry.index;

          totalVertices += posAttr.count;
          totalFaces += indexAttr ? indexAttr.count / 3 : posAttr.count / 3;

          // Get material color as fallback
          let materialColor = new THREE.Color(0xaaaaaa);
          if (child.material?.color) {
            materialColor = child.material.color.clone();
          }

          // Calculate total surface area
          let meshArea = 0;
          const v0 = new THREE.Vector3();
          const v1 = new THREE.Vector3();
          const v2 = new THREE.Vector3();

          if (indexAttr) {
            for (let i = 0; i < indexAttr.count; i += 3) {
              const i0 = indexAttr.getX(i);
              const i1 = indexAttr.getX(i + 1);
              const i2 = indexAttr.getX(i + 2);

              v0.fromBufferAttribute(posAttr, i0).applyMatrix4(child.matrixWorld);
              v1.fromBufferAttribute(posAttr, i1).applyMatrix4(child.matrixWorld);
              v2.fromBufferAttribute(posAttr, i2).applyMatrix4(child.matrixWorld);

              meshArea += triangleArea(v0, v1, v2);
            }
          } else {
            for (let i = 0; i < posAttr.count; i += 3) {
              v0.fromBufferAttribute(posAttr, i).applyMatrix4(child.matrixWorld);
              v1.fromBufferAttribute(posAttr, i + 1).applyMatrix4(child.matrixWorld);
              v2.fromBufferAttribute(posAttr, i + 2).applyMatrix4(child.matrixWorld);

              meshArea += triangleArea(v0, v1, v2);
            }
          }

          if (meshArea > 0) {
            meshes.push({
              geometry,
              worldMatrix: child.matrixWorld.clone(),
              materialColor,
              hasVertexColors: !!colorAttr,
              totalArea: meshArea,
            });
            totalSurfaceArea += meshArea;
          }
        }
      });

      console.log(`✓ Found ${meshes.length} mesh(es)`);
      console.log(`  - Total vertices: ${totalVertices.toLocaleString()}`);
      console.log(`  - Total faces: ${totalFaces.toLocaleString()}`);
      console.log(`  - Total surface area: ${totalSurfaceArea.toFixed(4)}`);

      if (meshes.length === 0 || totalSurfaceArea === 0) {
        reject(new Error('No valid geometry found in GLB file'));
        return;
      }

      // Allocate output arrays
      const actualPointCount = Math.min(pointCount, 500000); // Cap for safety
      console.log(`\n⏳ Sampling ${actualPointCount.toLocaleString()} points...`);

      const positions = new Float32Array(actualPointCount * 3);
      const colors = new Float32Array(actualPointCount * 3);
      const normals = new Float32Array(actualPointCount * 3);

      // Second pass: sample points from each mesh
      let pointIndex = 0;
      const tempPos = new THREE.Vector3();
      const tempNormal = new THREE.Vector3();
      const v0 = new THREE.Vector3();
      const v1 = new THREE.Vector3();
      const v2 = new THREE.Vector3();

      for (const mesh of meshes) {
        const meshPointCount = Math.floor((mesh.totalArea / totalSurfaceArea) * actualPointCount);
        if (meshPointCount === 0) continue;

        const geometry = mesh.geometry;
        const posAttr = geometry.attributes.position;
        const colorAttr = geometry.attributes.color;
        const indexAttr = geometry.index;

        // Build cumulative area array for weighted sampling
        const triangles = [];
        let cumulativeArea = 0;

        const getTriangleIndices = (i) => {
          if (indexAttr) {
            return [indexAttr.getX(i), indexAttr.getX(i + 1), indexAttr.getX(i + 2)];
          }
          return [i, i + 1, i + 2];
        };

        const triCount = indexAttr ? indexAttr.count : posAttr.count;
        for (let i = 0; i < triCount; i += 3) {
          const [i0, i1, i2] = getTriangleIndices(i);

          v0.fromBufferAttribute(posAttr, i0).applyMatrix4(mesh.worldMatrix);
          v1.fromBufferAttribute(posAttr, i1).applyMatrix4(mesh.worldMatrix);
          v2.fromBufferAttribute(posAttr, i2).applyMatrix4(mesh.worldMatrix);

          const area = triangleArea(v0, v1, v2);
          cumulativeArea += area;

          triangles.push({ i0, i1, i2, cumulativeArea });
        }

        // Binary search for triangle selection
        const findTriangle = (targetArea) => {
          let low = 0;
          let high = triangles.length - 1;
          while (low < high) {
            const mid = (low + high) >>> 1;
            if (triangles[mid].cumulativeArea < targetArea) {
              low = mid + 1;
            } else {
              high = mid;
            }
          }
          return triangles[low];
        };

        // Sample points
        for (let p = 0; p < meshPointCount && pointIndex < actualPointCount; p++) {
          const r = Math.random() * cumulativeArea;
          const tri = findTriangle(r);

          v0.fromBufferAttribute(posAttr, tri.i0).applyMatrix4(mesh.worldMatrix);
          v1.fromBufferAttribute(posAttr, tri.i1).applyMatrix4(mesh.worldMatrix);
          v2.fromBufferAttribute(posAttr, tri.i2).applyMatrix4(mesh.worldMatrix);

          // Random barycentric coordinates
          let u = Math.random();
          let v = Math.random();
          if (u + v > 1) { u = 1 - u; v = 1 - v; }
          const w = 1 - u - v;

          // Sample position
          tempPos.set(
            v0.x * w + v1.x * u + v2.x * v,
            v0.y * w + v1.y * u + v2.y * v,
            v0.z * w + v1.z * u + v2.z * v
          );

          // Calculate normal
          triangleNormal(v0, v1, v2, tempNormal);

          // Get color (interpolate vertex colors or use material color)
          let color;
          if (mesh.hasVertexColors && colorAttr) {
            const c0 = new THREE.Color().fromBufferAttribute(colorAttr, tri.i0);
            const c1 = new THREE.Color().fromBufferAttribute(colorAttr, tri.i1);
            const c2 = new THREE.Color().fromBufferAttribute(colorAttr, tri.i2);
            color = interpolateColor(c0, c1, c2, u, v, w);
          } else {
            color = mesh.materialColor;
          }

          // Store data
          const idx3 = pointIndex * 3;
          positions[idx3] = tempPos.x;
          positions[idx3 + 1] = tempPos.y;
          positions[idx3 + 2] = tempPos.z;

          normals[idx3] = tempNormal.x;
          normals[idx3 + 1] = tempNormal.y;
          normals[idx3 + 2] = tempNormal.z;

          colors[idx3] = color.r;
          colors[idx3 + 1] = color.g;
          colors[idx3 + 2] = color.b;

          pointIndex++;
        }

        // Progress indicator
        const progress = ((pointIndex / actualPointCount) * 100).toFixed(1);
        process.stdout.write(`\r  Progress: ${progress}%`);
      }

      console.log(`\n✓ Sampled ${pointIndex.toLocaleString()} points`);

      // Normalize positions (center at origin, scale to target size)
      console.log('⏳ Normalizing positions...');
      normalizePositions(positions, pointIndex, 80);

      // Create output data
      const outputData = {
        version: '1.0',
        generator: '3Dme-CLI',
        source: path.basename(glbPath),
        count: pointIndex,
        positions: Array.from(positions.slice(0, pointIndex * 3)).map(v => Math.round(v * 1000) / 1000),
        colors: Array.from(colors.slice(0, pointIndex * 3)).map(v => Math.round(v * 1000) / 1000),
        normals: Array.from(normals.slice(0, pointIndex * 3)).map(v => Math.round(v * 1000) / 1000),
      };

      resolve(outputData);
    }, (error) => {
      reject(new Error(`Failed to parse GLB: ${error.message}`));
    });
  });
}

function normalizePositions(positions, count, targetSize = 80) {
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

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;
  const maxSize = Math.max(sizeX, sizeY, sizeZ);

  const scale = maxSize > 0 ? targetSize / maxSize : 1;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    positions[i3] = (positions[i3] - centerX) * scale;
    positions[i3 + 1] = (positions[i3 + 1] - centerY) * scale;
    positions[i3 + 2] = (positions[i3 + 2] - centerZ) * scale;
  }

  console.log(`✓ Normalized: center=(${centerX.toFixed(3)}, ${centerY.toFixed(3)}, ${centerZ.toFixed(3)}), scale=${scale.toFixed(4)}`);
}

// Run conversion
(async () => {
  try {
    const startTime = Date.now();

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`✓ Created output directory: ${outputDir}`);
    }

    const data = await convertGLBToParticles(inputPath, targetPointCount);

    // Write JSON output
    console.log('⏳ Writing output file...');
    const jsonStr = JSON.stringify(data);
    fs.writeFileSync(outputPath, jsonStr);

    const fileSize = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ Conversion complete!`);
    console.log(`   Points: ${data.count.toLocaleString()}`);
    console.log(`   Output: ${outputPath} (${fileSize} MB)`);
    console.log(`   Time: ${elapsed}s`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
})();
