import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ct1Logo from "@/assets/ct1-logo-main.png";

// Declare THREE types for CDN-loaded library
declare global {
  interface Window {
    THREE: any;
  }
}

export default function NetworkMap() {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create script element for Three.js
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.async = true;
    
    script.onload = () => {
      initThreeScene();
    };
    
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const initThreeScene = () => {
    if (!canvasRef.current) return;
    
    const THREE = window.THREE;
    if (!THREE) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);

    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 40);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    canvasRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xe31e24, 1, 100);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    // USA Map coordinates (simplified state outlines)
    const usaStates = [
      // Michigan (enlarged)
      { x: 5, y: 0, z: 10, scale: 2.5, name: "Michigan" },
      // Other major states
      { x: -8, y: 0, z: 12, scale: 1, name: "New York" },
      { x: -18, y: 0, z: -5, scale: 1.5, name: "California" },
      { x: 0, y: 0, z: 8, scale: 1.2, name: "Illinois" },
      { x: 2, y: 0, z: -5, scale: 1.3, name: "Texas" },
      { x: -12, y: 0, z: -8, scale: 1, name: "Arizona" },
      { x: -4, y: 0, z: 12, scale: 0.8, name: "Pennsylvania" },
      { x: -16, y: 0, z: 10, scale: 1, name: "Washington" },
      { x: -2, y: 0, z: 5, scale: 0.9, name: "Indiana" },
      { x: 6, y: 0, z: 2, scale: 0.8, name: "Florida" },
    ];

    // Create state representations
    usaStates.forEach((state) => {
      const geometry = new THREE.CircleGeometry(state.scale * 0.8, 16);
      const material = new THREE.MeshPhongMaterial({
        color: state.name === "Michigan" ? 0xe31e24 : 0x1a1f2c,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const circle = new THREE.Mesh(geometry, material);
      circle.rotation.x = -Math.PI / 2;
      circle.position.set(state.x, state.y, state.z);
      scene.add(circle);

      // Add border
      const edgeGeometry = new THREE.EdgesGeometry(geometry);
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: state.name === "Michigan" ? 0xff4444 : 0x444444,
        linewidth: 2,
      });
      const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      edges.rotation.x = -Math.PI / 2;
      edges.position.set(state.x, state.y + 0.01, state.z);
      scene.add(edges);
    });

    // Fraser, Michigan location (flag/marker)
    const fraserMarkerGeometry = new THREE.ConeGeometry(0.3, 2, 8);
    const fraserMarkerMaterial = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5,
    });
    const fraserMarker = new THREE.Mesh(fraserMarkerGeometry, fraserMarkerMaterial);
    fraserMarker.position.set(5, 2, 10);
    scene.add(fraserMarker);

    // Flag pole
    const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
    const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(5, 1, 10);
    scene.add(pole);

    // Markets to connect (Fraser to major cities)
    const markets = [
      // Local Michigan
      { name: "Detroit", x: 4.5, z: 9.5 },
      { name: "Grand Rapids", x: 4, z: 10.5 },
      { name: "Ann Arbor", x: 4.8, z: 9.8 },
      { name: "Lansing", x: 4.5, z: 10 },
      // National
      { name: "New York", x: -8, z: 12 },
      { name: "Los Angeles", x: -18, z: -5 },
      { name: "Chicago", x: 0, z: 8 },
      { name: "Houston", x: 1, z: -3 },
      { name: "Phoenix", x: -12, z: -8 },
      { name: "Philadelphia", x: -4, z: 12 },
      { name: "San Antonio", x: 0, z: -4 },
      { name: "Dallas", x: 2, z: -2 },
      { name: "Miami", x: 6, z: 2 },
      { name: "Seattle", x: -16, z: 10 },
      { name: "Boston", x: -9, z: 13 },
      { name: "Denver", x: -8, z: 3 },
    ];

    const fraserPos = new THREE.Vector3(5, 0, 10);
    const arches: any[] = [];

    // Create animated arches
    markets.forEach((market, index) => {
      const targetPos = new THREE.Vector3(market.x, 0, market.z);
      const distance = fraserPos.distanceTo(targetPos);
      const midPoint = new THREE.Vector3(
        (fraserPos.x + targetPos.x) / 2,
        distance * 0.4, // Arc height
        (fraserPos.z + targetPos.z) / 2
      );

      // Create curved path
      const curve = new THREE.QuadraticBezierCurve3(fraserPos, midPoint, targetPos);
      const points = curve.getPoints(50);
      const curveGeometry = new THREE.BufferGeometry().setFromPoints(points);

      const curveMaterial = new THREE.LineBasicMaterial({
        color: 0xe31e24,
        linewidth: 3,
        transparent: true,
        opacity: 0,
      });

      const curveLine = new THREE.Line(curveGeometry, curveMaterial);
      scene.add(curveLine);
      arches.push(curveLine);

      // Create tube for 3D effect
      const tubeGeometry = new THREE.TubeGeometry(curve, 50, 0.08, 8, false);
      const tubeMaterial = new THREE.MeshPhongMaterial({
        color: 0xe31e24,
        emissive: 0xe31e24,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0,
      });
      const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      scene.add(tube);
      arches.push(tube);

      // Market destination marker
      const markerGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const markerMaterial = new THREE.MeshPhongMaterial({
        color: 0xe31e24,
        emissive: 0xe31e24,
        emissiveIntensity: 0.5,
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(market.x, 0.2, market.z);
      scene.add(marker);
    });

    // CT1 Logo (floating in center)
    const logoTexture = new THREE.TextureLoader().load(ct1Logo);
    const logoGeometry = new THREE.PlaneGeometry(4, 4);
    const logoMaterial = new THREE.MeshBasicMaterial({
      map: logoTexture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const logoMesh = new THREE.Mesh(logoGeometry, logoMaterial);
    logoMesh.position.set(0, 8, 0);
    scene.add(logoMesh);

    // Mouse controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let rotation = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaMove = {
          x: e.clientX - previousMousePosition.x,
          y: e.clientY - previousMousePosition.y,
        };

        rotation.y += deltaMove.x * 0.005;
        rotation.x += deltaMove.y * 0.005;

        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      camera.position.z += e.deltaY * 0.05;
      camera.position.z = Math.max(20, Math.min(60, camera.position.z));
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("wheel", onWheel);

    // Animation
    let animationTime = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      animationTime += 0.016;

      // Rotate scene based on mouse
      scene.rotation.y = rotation.y;
      scene.rotation.x = Math.max(-0.5, Math.min(0.5, rotation.x));

      // Animate arches appearing
      arches.forEach((arch, index) => {
        const delay = index * 0.15;
        const progress = Math.min(1, Math.max(0, (animationTime - delay) / 2));
        if (arch.material) {
          arch.material.opacity = progress * 0.8;
        }
      });

      // Floating logo animation
      logoMesh.position.y = 8 + Math.sin(animationTime) * 0.5;
      logoMesh.rotation.y += 0.005;

      // Pulsing Fraser marker
      fraserMarker.material.emissiveIntensity = 0.5 + Math.sin(animationTime * 2) * 0.3;

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("wheel", onWheel);
      if (canvasRef.current && renderer.domElement) {
        canvasRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-background/95 to-transparent p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-2xl md:text-4xl font-bold text-foreground">
              CT1 Nationwide Network
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              A Network of the Nations Leading Contractors
            </p>
          </div>
          <div className="w-24"></div>
        </div>
      </div>

      {/* 3D Canvas */}
      <div ref={canvasRef} className="w-full h-full" />

      {/* Instructions Overlay */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 bg-background/80 backdrop-blur-sm px-6 py-3 rounded-full border border-border">
        <p className="text-sm text-muted-foreground text-center">
          <span className="hidden md:inline">Click and drag to rotate • Scroll to zoom</span>
          <span className="md:hidden">Touch and drag to explore</span>
        </p>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 right-6 z-10 bg-card/90 backdrop-blur-sm p-4 rounded-lg border border-border space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span className="text-xs text-muted-foreground">CT1 Hub - Fraser, MI</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-primary"></div>
          <span className="text-xs text-muted-foreground">Network Connections</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted"></div>
          <span className="text-xs text-muted-foreground">Major Markets</span>
        </div>
      </div>
    </div>
  );
}

