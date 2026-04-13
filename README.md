# 3Dme

**Transform any image into stunning 3D particle visualizations - 100% FREE**

3Dme is an open-source application that combines cutting-edge AI for image generation and 3D reconstruction with WebGPU-powered particle rendering. Create breathtaking particle art from text prompts or images in seconds.

![3Dme Demo](docs/demo.gif)

## Features

- **AI Image Generation** - Create any image from text using Nano Banana Pro (Gemini 3)
- **Instant 3D Conversion** - Transform images to 3D models in 0.7-30 seconds
- **Million Particle Rendering** - WebGPU compute shaders for silky smooth performance
- **Real-time Customization** - Adjust colors, physics, and effects on the fly
- **Multiple AI Backends** - SPAR3D, TRELLIS, Hunyuan3D, InstantMesh
- **Export Options** - Download as GLB, video, or share directly
- **100% Free** - No API keys, no subscriptions, no hidden costs

## The Pipeline

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   TEXT/IMAGE    │ →  │   AI 3D MODEL   │ →  │  PARTICLE MESH  │ →  │  WEBGPU RENDER  │
│   Nano Banana   │    │   SPAR3D etc.   │    │  Surface Sample │    │  500k-1M pts    │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- Modern browser with WebGPU support (Chrome 113+, Edge 113+, Firefox Nightly)

### Installation

```bash
# Clone the repository
git clone https://github.com/romain-girardi-eng/3Dme.git
cd 3Dme

# Install dependencies
cd frontend
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

## Usage

### 1. Generate an Image

Type a prompt like:
- "A majestic lion with a flowing mane"
- "Ancient Greek philosopher bust"
- "Futuristic robot head"
- "Crystal dragon sculpture"

Or upload your own image.

### 2. Convert to 3D

Click "Generate 3D" to convert your image using one of our free AI backends:

| Backend | Speed | Quality | Best For |
|---------|-------|---------|----------|
| **SPAR3D** | 0.7s | ⭐⭐⭐⭐⭐ | Quick iterations |
| **TRELLIS.2** | 5-10s | ⭐⭐⭐⭐⭐ | High detail |
| **Hunyuan3D** | 10-30s | ⭐⭐⭐⭐⭐ | PBR materials |
| **InstantMesh** | 10s | ⭐⭐⭐⭐ | Balanced |

### 3. Customize Particles

Adjust your visualization:
- **Particle Count** - 10k to 1M particles
- **Colors** - Rainbow, monochrome, gradient schemes
- **Physics** - Gravity, attraction, turbulence
- **Effects** - Bloom, trails, depth of field
- **Animation** - Rotation, morphing, breathing

### 4. Export

- **GLB** - 3D model file
- **Video** - MP4 recording
- **GIF** - Animated preview
- **Share** - Direct link

## Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Three.js** - 3D rendering
- **WebGPU + TSL** - GPU compute

### AI Services (All FREE)
- **Puter.js** - Nano Banana Pro image generation
- **SPAR3D** - Stability AI's instant 3D
- **TRELLIS.2** - Microsoft's quality 3D
- **Hunyuan3D** - Tencent's PBR 3D
- **InstantMesh** - TencentARC's balanced 3D

## Project Structure

```
3Dme/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── particles/      # Core particle system
│   │   │   ├── ui/             # UI components
│   │   │   └── controls/       # User controls
│   │   ├── hooks/              # React hooks
│   │   ├── services/           # API services
│   │   ├── pages/              # Page components
│   │   └── types/              # TypeScript types
│   ├── public/
│   └── package.json
├── docs/
│   └── ARCHITECTURE.md
├── CLAUDE.md
└── README.md
```

## Configuration

No configuration needed! All AI services are free and require no API keys.

### Optional: Environment Variables

```bash
# frontend/.env (optional)
VITE_DEFAULT_BACKEND=spar3d  # Default 3D backend
VITE_MAX_PARTICLES=500000    # Maximum particle count
```

## Browser Support

| Browser | WebGPU | WebGL Fallback |
|---------|--------|----------------|
| Chrome 113+ | ✅ | ✅ |
| Edge 113+ | ✅ | ✅ |
| Firefox Nightly | ✅ | ✅ |
| Safari 17+ | ✅ | ✅ |
| Other | ❌ | ✅ |

## Performance

- **Target:** 60fps with 500k particles
- **WebGPU:** 1M+ particles possible
- **WebGL Fallback:** 100k particles
- **Memory:** ~500MB GPU memory

## Development

### Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview build

# Testing
npm test             # Run tests
npm run test:ui      # Test UI
npm run coverage     # Coverage report

# Code Quality
npm run lint         # Lint check
npm run lint:fix     # Fix lint issues
npm run typecheck    # Type check
```

### Adding Features

See [CLAUDE.md](CLAUDE.md) for detailed development guidelines.

## Deployment

### Cloudflare Pages (Recommended - FREE)

```bash
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=3dme
```

### Vercel (FREE)

```bash
cd frontend
npm run build
npx vercel --prod
```

### Netlify (FREE)

```bash
cd frontend
npm run build
# Deploy dist/ folder via Netlify UI
```

## Contributing

Contributions are welcome! Please read our contributing guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## Roadmap

- [x] Basic particle rendering
- [x] Nano Banana Pro integration
- [x] SPAR3D integration
- [ ] TRELLIS.2 integration
- [ ] Hunyuan3D integration
- [ ] InstantMesh integration
- [ ] Video export
- [ ] Preset library
- [ ] User galleries
- [ ] Mobile optimization
- [ ] VR support

## Acknowledgments

- [Three.js](https://threejs.org/) - 3D rendering
- [Stability AI](https://stability.ai/) - SPAR3D
- [Microsoft](https://github.com/microsoft/TRELLIS) - TRELLIS
- [Tencent](https://github.com/Tencent-Hunyuan/Hunyuan3D-2) - Hunyuan3D
- [TencentARC](https://github.com/TencentARC/InstantMesh) - InstantMesh
- [Puter](https://puter.com/) - Free AI image generation
- [Maxime Heckel](https://blog.maximeheckel.com/) - WebGPU/TSL tutorials
- [Wawa Sensei](https://wawasensei.dev/) - GPGPU tutorials

## License

MIT License - Free for personal and commercial use.

---

Made with particles by the 3Dme team
