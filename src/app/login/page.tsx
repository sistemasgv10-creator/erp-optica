'use client';

import { useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

// Componente de lentes flotantes
function FloatingGlasses() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const glassesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    rotationSpeed: number;
  }>>([]);

  useEffect(() => {
    // Inicializar lentes con posiciones y velocidades aleatorias
    const numGlasses = 10;
    glassesRef.current = Array.from({ length: numGlasses }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 2,
    }));

    const animate = () => {
      glassesRef.current.forEach((glass, index) => {
        // Actualizar posición
        glass.x += glass.vx;
        glass.y += glass.vy;
        glass.rotation += glass.rotationSpeed;

        // Rebotar en los bordes
        if (glass.x <= 0 || glass.x >= window.innerWidth - 60) {
          glass.vx *= -1;
          glass.x = glass.x <= 0 ? 0 : window.innerWidth - 60;
        }
        if (glass.y <= 0 || glass.y >= window.innerHeight - 60) {
          glass.vy *= -1;
          glass.y = glass.y <= 0 ? 0 : window.innerHeight - 60;
        }

        // Actualizar elemento DOM
        const element = document.getElementById(`glass-${index}`);
        if (element) {
          element.style.transform = `translate(${glass.x}px, ${glass.y}px) rotate(${glass.rotation}deg)`;
        }
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <div ref={canvasRef} className="fixed inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          id={`glass-${i}`}
          className="absolute text-4xl opacity-100"
          style={{ willChange: 'transform' }}
        >
          👓
        </div>
      ))}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Credenciales incorrectas', {
          description: 'Verifica tu email y contraseña',
        });
      } else {
        toast.success('Inicio de sesión exitoso');
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      toast.error('Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 relative overflow-hidden">
      {/* Lentes flotantes en el fondo */}
      <FloatingGlasses />

      <div className="w-full max-w-md relative z-10">
        {/* Logo sin fondo azul */}
        <div className="text-center mb-8">
          <Image
            src="/images/logvision10.png"
            alt="Logo Vision10s"
            width={180}
            height={180}
            className="mx-auto object-contain"
            priority
          />
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Correo electrónico"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  placeholder="Contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Sistema V10 © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}