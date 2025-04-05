"use client"

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { 
  MapPin, 
  User, 
  Lock, 
  Mail, 
  Shield, 
  Cloud,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from "next/navigation";


export default function LoginPage() {
  const { signUp, signIn, user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  });
  const [location, setLocation] = useState({
    latitude: 0,
    longitude: 0,
    address: '',
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length > 5) strength += 1;
    if (password.match(/[a-z]+/)) strength += 1;
    if (password.match(/[A-Z]+/)) strength += 1;
    if (password.match(/[0-9]+/)) strength += 1;
    if (password.match(/[$@#&!]+/)) strength += 1;
    return strength;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (name === "password") setPasswordStrength(calculatePasswordStrength(value));
  };

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({
            latitude,
            longitude,
            address: 'Location detected successfully'
          });
        },
        (error) => {
          console.error('Location error:', error);
        }
      );
    }
  };

  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signIn(formData.email, formData.password);
        router.push('/dashboard');
      } else {
        await signUp(formData.name, formData.email, formData.password, location.address);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("Authentication error:", error);
    }
  };


  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      alpha: true 
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    scene.background = new THREE.Color(0x0f766e); // Teal-700 equivalent

    // Particles setup
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);
    const sizeArray = new Float32Array(particlesCount);

    for (let i = 0; i < particlesCount; i++) {
        // Spread particles more dynamically
        posArray[i*3] = (Math.random() - 0.5) * 200;     // x
        posArray[i*3+1] = (Math.random() - 0.5) * 200;   // y
        posArray[i*3+2] = (Math.random() - 0.5) * 100;   // z
  
        sizeArray[i] = Math.random() * 0.5 + 0.1; // Random size between 1 and 6
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1));

    const particlesMaterial = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(0x5eead4) }, // Teal-500 color
          pointTexture: { value: new THREE.TextureLoader().load('/api/placeholder/10/10') }
        },
        vertexShader: `
          attribute float size;
          varying vec3 vColor;
          void main() {
            vColor = vec3(1.0, 1.0, 1.0);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
             `,
      fragmentShader: `
        uniform vec3 color;
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        void main() {
          vec2 coords = gl_PointCoord - vec2(0.5);
          float dist = length(coords);
          float circle = 1.0 - smoothstep(0.4, 0.5, dist);
          
          gl_FragColor = vec4(color, circle * 0.7);
        }
      `,
      transparent: true,
      depthTest: false
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    camera.position.z = 1;

    const clock = new THREE.Clock();
    const tick = () => {
      const elapsedTime = clock.getElapsedTime();

    particlesMesh.rotation.y = elapsedTime * 0.09;
    particlesMesh.rotation.x = elapsedTime * 0.09;

    const positions = particlesMesh.geometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
        positions[i] += Math.sin(elapsedTime + positions[i]) * 0.01;
        positions[i+1] += Math.cos(elapsedTime + positions[i+1]) * 0.01;
    }
    particlesMesh.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);

    requestAnimationFrame(tick);
    };
    tick();

    const handleResize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
  
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
  
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    if(user) {
      router.push('/dashboard');
    };

    return () => {
      window.removeEventListener('resize', handleResize);
      scene.remove(particlesMesh);
      particlesGeometry.dispose();
      particlesMaterial.dispose();
    };
      
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 to-teal-950 flex items-center justify-center p-4 relative overflow-hidden">
         {/* Three.js Background Canvas */}
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 z-0 w-full h-full"
      />
      
      <div className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-3xl w-full max-w-md p-8 space-y-6 border border-white/30 relative z-10">
        {/* Animated logo/header */}
        <div className="flex items-center justify-center mb-6">
          <Cloud className="text-teal-600 w-12 h-12 mr-3 animate-bounce" />
          <h2 className="text-4xl font-bold text-teal-800 tracking-tight">
            Disaster Shield
          </h2>
        </div>

        {/* Toggle switch */}
        <div className="flex justify-center mb-4">
          <div className="rounded-full p-1 flex items-center">
            <button 
              onClick={() => setIsLogin(true)}
              className={`px-4 py-2 rounded-full transition-colors ${
                isLogin 
                  ? 'bg-teal-600 text-white' 
                  : 'text-teal-600 hover:bg-teal-200'
              }`}
            >
              Login
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`px-4 py-2 rounded-full transition-colors ${
                !isLogin 
                  ? 'bg-teal-600 text-white' 
                  : 'text-teal-600 hover:bg-teal-200'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative group">
              <User className="absolute left-3 top-3 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                autoComplete='name'
                value={formData.name}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                required={!isLogin}
              />
            </div>
          )}
          
          <div className="relative group">
            <Mail className="absolute left-3 top-3 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              autoComplete="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              required
            />
          </div>
          
          <div className="relative group">
            <Lock className="absolute left-3 top-3 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={formData.password}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              required
            />
            {/* Password strength indicator */}
            <div className="mt-1 flex space-x-1">
              {[1,2,3,4,5].map((level) => (
                <div 
                  key={level} 
                  className={`h-1 w-full rounded-full transition-colors ${
                    level <= passwordStrength 
                      ? 'bg-teal-500' 
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {!isLogin && (
            <div className="relative group">
              <MapPin className="absolute left-3 top-3 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
              <input
                type="text"
                name="address"
                placeholder="Location Address"
                autoComplete='street-address'
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                value={location.address}
                onChange={(e) => setLocation(prev => ({...prev, address: e.target.value}))}
              />
              <button
                type="button"
                onClick={getCurrentLocation}
                className="absolute right-3 top-3 bg-teal-500 text-white p-1 rounded-full hover:bg-teal-600 transition-colors"
              >
                <Shield className="w-5 h-5" />
              </button>
            </div>
          )}
          
          <button 
            type="submit" 
            className="w-full bg-teal-600 text-white py-3 rounded-xl hover:bg-teal-700 transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
          >
            {isLogin ? 'Secure Login' : 'Create Account'}
          </button>
        </form>
        
        <div className="text-center">
          <p className="text-gray-600">
            {isLogin 
              ? "Don't have an account? " 
              : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-teal-600 hover:underline font-semibold"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}