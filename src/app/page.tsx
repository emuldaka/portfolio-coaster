
"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const HomePage: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);

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
      camera.position.set(0, 5, 20);

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
      scrollRef.current += 0.0005;
      const looptime = 20;
      const t = (scrollRef.current % looptime) / looptime;

      // Camera Position
      const position = track.getPointAt(t);
      camera.position.copy(position);

      // Camera Look At
      const lookAt = track.getPointAt((t + 0.01) % 1);
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
  }, []);

  return <div style={{ height: '100vh', width: '100vw' }} ref={mountRef} />;
};

export default HomePage;
