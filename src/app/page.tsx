"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

const HomePage: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);

  const [speed, setSpeed] = useState(0.0005);
  const [verticalAngle, setVerticalAngle] = useState(2);

  useEffect(() => {
    // Check if localStorage is available (client-side)
    if (typeof window !== 'undefined') {
      const storedSpeed = localStorage.getItem('speed');
      if (storedSpeed) {
        setSpeed(parseFloat(storedSpeed));
      }

      const storedVerticalAngle = localStorage.getItem('verticalAngle');
      if (storedVerticalAngle) {
        setVerticalAngle(parseFloat(storedVerticalAngle));
      }
    }
  }, []);

  useEffect(() => {
    // Check if localStorage is available (client-side)
    if (typeof window !== 'undefined') {
      localStorage.setItem('speed', speed.toString());
    }
  }, [speed]);

  useEffect(() => {
    // Check if localStorage is available (client-side)
    if (typeof window !== 'undefined') {
      localStorage.setItem('verticalAngle', verticalAngle.toString());
    }
  }, [verticalAngle]);

  useEffect(() => {
    let scene: THREE.Scene,
      camera: THREE.PerspectiveCamera,
      renderer: THREE.WebGLRenderer,
      rollerCoasterGroup: THREE.Group,
      track: THREE.CatmullRomCurve3,
      cameraTarget: THREE.Vector3;

    const init = () => {
      if (!mountRef.current) return;

      // Scene
      scene = new THREE.Scene();

      // Camera
      camera = new THREE.PerspectiveCamera(
        75,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        1000
      );
      // Initial camera position (adjust as needed)
      camera.position.set(0, 5, 0);

      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.setClearColor(0xA9BA93, 1); // Light Green Background
      mountRef.current.appendChild(renderer.domElement);

      // Rollercoaster Track
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(10, 5, -10),
        new THREE.Vector3(20, 0, -20),
        new THREE.Vector3(30, 10, -30),
        new THREE.Vector3(40, 0, -40),
        new THREE.Vector3(50, 5, -50),
        new THREE.Vector3(50, 10, -60),
        new THREE.Vector3(40, 15, -70),
        new THREE.Vector3(30, 10, -80),
        new THREE.Vector3(20, 5, -70),
        new THREE.Vector3(10, 3, -60),
        new THREE.Vector3(0, 0, -50),
      ];

      track = new THREE.CatmullRomCurve3(points, true);
      const geometry = new THREE.TubeGeometry(track, 200, 0.5, 20, true);
      const material = new THREE.MeshBasicMaterial({ color: 0x1E3A28 }); // Dark Green Track
      const tube = new THREE.Mesh(geometry, material);

      // Camera Target
      cameraTarget = new THREE.Vector3();

      // Rollercoaster Car
      rollerCoasterGroup = new THREE.Group();
      rollerCoasterGroup.add(camera);
      scene.add(tube);
      scene.add(rollerCoasterGroup);
    };

    const animate = () => {
      if (!mountRef.current) return;

      // Scroll Wheel adjustment
      scrollRef.current += speed;
      const looptime = 20;
      const t = (scrollRef.current % looptime) / looptime;

      // Camera Position
      const position = track.getPointAt(t);
      // Position the camera slightly above the track
      camera.position.copy(position).add(new THREE.Vector3(0, verticalAngle, 0));

      // Camera Look At
      const lookAt = track.getPointAt((t + 0.01) % 1); // Look slightly ahead
      cameraTarget.copy(lookAt);
      camera.lookAt(cameraTarget);

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    const handleResize = () => {
      if (mountRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    };

    const handleScroll = (e: WheelEvent) => {
      scrollRef.current += e.deltaY * 0.0001;
    };

    init();
    animate();

    window.addEventListener('resize', handleResize);
    window.addEventListener('wheel', handleScroll);

    return () => {
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('wheel', handleScroll);
    };
  }, [speed, verticalAngle]);

  return (
    <>
      <div style={{ height: '100vh', width: '100vw' }} ref={mountRef} />
      <div style={{ position: 'fixed', top: '20px', left: '20px', background: 'white', padding: '20px', borderRadius: '10px' }}>
        <div>
          <Label htmlFor="speed">Speed</Label>
          <Slider
            id="speed"
            defaultValue={[speed * 10000]}
            max={10}
            min={0}
            step={0.1}
            onValueChange={(value) => setSpeed(value[0] / 10000)}
          />
        </div>
        <div>
          <Label htmlFor="verticalAngle">Vertical Angle</Label>
          <Slider
            id="verticalAngle"
            defaultValue={[verticalAngle]}
            max={10}
            min={0}
            step={0.1}
            onValueChange={(value) => setVerticalAngle(value[0])}
          />
        </div>
      </div>
    </>
  );
};

export default HomePage;

    