"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const HomePage: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);

  // Devtool state variables with default values
  const [cameraYOffset, setCameraYOffset] = useState(10);
  const [cameraZOffset, setCameraZOffset] = useState(5);
  const [cameraLookAtOffset, setCameraLookAtOffset] = useState(5);
  const [scrollSpeedMultiplier, setScrollSpeedMultiplier] = useState(0.0001);

  useEffect(() => {
    // Load saved settings from local storage
    const savedYOffset = localStorage.getItem('cameraYOffset');
    const savedZOffset = localStorage.getItem('cameraZOffset');
    const savedLookAtOffset = localStorage.getItem('cameraLookAtOffset');
    const savedScrollSpeed = localStorage.getItem('scrollSpeedMultiplier');

    if (savedYOffset) setCameraYOffset(parseFloat(savedYOffset));
    if (savedZOffset) setCameraZOffset(parseFloat(savedZOffset));
    if (savedLookAtOffset) setCameraLookAtOffset(parseFloat(savedLookAtOffset));
    if (savedScrollSpeed) setScrollSpeedMultiplier(parseFloat(savedScrollSpeed));
  }, []);

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
  
      // Initial camera position
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
      const material = new THREE.MeshBasicMaterial({ color: 0x1E3A28, side: THREE.DoubleSide }); // Dark Green Track
      const tube = new THREE.Mesh(geometry, material);
  
      // Camera Target
      cameraTarget = new THREE.Vector3();
  
      // Rollercoaster Car
      rollerCoasterGroup = new THREE.Group();
      rollerCoasterGroup.add(camera);
      scene.add(tube);
      scene.add(rollerCoasterGroup);
  
       // Start Marker (Head)
       const startMarkerGeometry = new THREE.BoxGeometry(1, 1, 1);
       const startMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0x0000FF }); // Blue
       const startMarker = new THREE.Mesh(startMarkerGeometry, startMarkerMaterial);
       startMarker.position.copy(track.getPointAt(0));
       startMarker.rotation.copy(track.computeFrenetFrames(200, true).tangents[0]);
       scene.add(startMarker);
   
       // End Marker (Tail)
       const endMarkerGeometry = new THREE.BoxGeometry(1, 1, 1);
       const endMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 }); // Red
       const endMarker = new THREE.Mesh(endMarkerGeometry, endMarkerMaterial);
       endMarker.position.copy(track.getPointAt(1));
       endMarker.rotation.copy(track.computeFrenetFrames(200, true).tangents[199]);
       scene.add(endMarker);
  
      // Track Length
      const trackLength = track.getLength();
      console.log('Track Length:', trackLength);
    };
  
    const animate = () => {
      if (!mountRef.current) return;
  
      const looptime = 20;
      const t = (scrollRef.current % looptime) / looptime;
  
      // Camera Position
      const position = track.getPointAt(t);
      camera.position.copy(position).add(new THREE.Vector3(0, cameraYOffset, cameraZOffset));
  
      // Camera Look At
      const lookAt = track.getPointAt((t + 0.01) % 1); // Look slightly ahead
      cameraTarget.copy(lookAt);
      cameraTarget.y += cameraLookAtOffset; // Adjust this value to look higher
  
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
      scrollRef.current += e.deltaY * scrollSpeedMultiplier;
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
  }, [cameraYOffset, cameraZOffset, cameraLookAtOffset, scrollSpeedMultiplier]);

  // Devtool change handlers
  const handleYOffsetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setCameraYOffset(newValue);
    localStorage.setItem('cameraYOffset', newValue.toString());
  };

  const handleZOffsetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setCameraZOffset(newValue);
    localStorage.setItem('cameraZOffset', newValue.toString());
  };

  const handleLookAtOffsetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setCameraLookAtOffset(newValue);
    localStorage.setItem('cameraLookAtOffset', newValue.toString());
  };

  const handleSpeedMultiplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setScrollSpeedMultiplier(newValue);
    localStorage.setItem('scrollSpeedMultiplier', newValue.toString());
  };

  return (
    <>
      <div style={{ height: '100vh', width: '100vw', position: 'relative' }} ref={mountRef} />

      {/* DevTools Panel */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(255, 255, 255, 0.7)', padding: '10px', borderRadius: '5px', zIndex: 10 }}>
        <div>
          <label htmlFor="yOffset">Y Offset:</label>
          <input
            type="number"
            id="yOffset"
            value={cameraYOffset}
            onChange={handleYOffsetChange}
            step="0.5"
          />
        </div>
        <div>
          <label htmlFor="zOffset">Z Offset:</label>
          <input
            type="number"
            id="zOffset"
            value={cameraZOffset}
            onChange={handleZOffsetChange}
            step="0.5"
          />
        </div>
        <div>
          <label htmlFor="lookAtOffset">Look At Offset:</label>
          <input
            type="number"
            id="lookAtOffset"
            value={cameraLookAtOffset}
            onChange={handleLookAtOffsetChange}
            step="0.5"
          />
        </div>
        <div>
          <label htmlFor="speedMultiplier">Scroll Speed:</label>
          <input
            type="number"
            id="speedMultiplier"
            value={scrollSpeedMultiplier}
            onChange={handleSpeedMultiplierChange}
            step="0.00005"
          />
        </div>
      </div>
    </>
  );
};

export default HomePage;
