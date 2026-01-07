import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.3) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-float" />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float"
        style={{ animationDelay: '1s' }}
      />

      <div className="relative text-center max-w-2xl mx-auto">
        {/* 404 Text */}
        <div className="mb-8">
          <h1 className="text-[150px] md:text-[200px] font-bold leading-none">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              404
            </span>
          </h1>
        </div>

        {/* Message */}
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved to a different location.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/">
            <Button size="lg" className="gap-2">
              <Home className="w-5 h-5" />
              Go to Homepage
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" size="lg" className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800">
              <Search className="w-5 h-5" />
              Contact Support
            </Button>
          </Link>
        </div>

        {/* Additional Links */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <p className="text-slate-500 text-sm mb-4">Or check out these pages:</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/services"
              className="text-slate-400 hover:text-blue-400 transition-colors"
            >
              Services
            </Link>
            <Link
              href="/about"
              className="text-slate-400 hover:text-blue-400 transition-colors"
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className="text-slate-400 hover:text-blue-400 transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
