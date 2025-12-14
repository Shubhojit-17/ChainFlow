'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
}: ButtonProps) {
  const baseStyles = `
    relative inline-flex items-center justify-center gap-2 font-semibold
    transition-all duration-300 overflow-hidden
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-purple-600 to-cyan-500 text-white
      hover:shadow-glow-md hover:scale-[1.02]
      rounded-2xl border-0
    `,
    secondary: `
      bg-white/5 border border-white/10 text-white
      hover:bg-white/10 hover:border-purple-500/30
      rounded-2xl
    `,
    ghost: `
      bg-transparent text-gray-400 
      hover:text-white hover:bg-white/5
      rounded-xl
    `,
    danger: `
      bg-red-500/10 border border-red-500/30 text-red-400
      hover:bg-red-500/20 hover:border-red-500/50
      rounded-2xl
    `,
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {/* Shimmer Effect for Primary */}
      {variant === 'primary' && (
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
            translate-x-[-100%] animate-shimmer" />
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inherit">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      <span className={`relative z-10 flex items-center gap-2 ${loading ? 'opacity-0' : ''}`}>
        {Icon && iconPosition === 'left' && <Icon className="w-5 h-5" />}
        {children}
        {Icon && iconPosition === 'right' && <Icon className="w-5 h-5" />}
      </span>
    </motion.button>
  );
}

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ 
  children, 
  className = '', 
  hover = true,
  glow = false,
  padding = 'md',
}: CardProps) {
  const paddingSizes = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <motion.div
      whileHover={hover ? { y: -4 } : {}}
      className={`
        glass-card ${paddingSizes[padding]}
        ${glow ? 'glow-effect' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: LucideIcon;
  iconColor?: string;
}

export function StatCard({ 
  label, 
  value, 
  change, 
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'from-purple-500 to-cyan-500',
}: StatCardProps) {
  const changeColors = {
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-gray-400',
  };

  return (
    <Card className="stat-card" hover={true}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-gray-400 text-sm font-medium">{label}</span>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconColor} 
            flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-white">{value}</span>
        {change && (
          <span className={`text-sm font-medium ${changeColors[changeType]}`}>
            {change}
          </span>
        )}
      </div>
    </Card>
  );
}

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export function Badge({ 
  children, 
  variant = 'default',
  size = 'md',
}: BadgeProps) {
  const variants = {
    default: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span className={`
      inline-flex items-center gap-1 rounded-full border font-medium
      ${variants[variant]} ${sizes[size]}
    `}>
      {children}
    </span>
  );
}

interface InputProps {
  label?: string;
  placeholder?: string;
  type?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  icon?: LucideIcon;
  suffix?: string;
}

export function Input({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  error,
  disabled = false,
  icon: Icon,
  suffix,
}: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <Icon className="w-5 h-5 text-gray-500" />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            input-field
            ${Icon ? 'pl-12' : ''}
            ${suffix ? 'pr-16' : ''}
            ${error ? 'border-red-500/50 focus:border-red-500' : ''}
          `}
        />
        {suffix && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <span className="text-gray-500 font-medium">{suffix}</span>
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  size = 'md',
  color = 'from-purple-500 to-cyan-500',
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Progress</span>
          <span className="text-white font-medium">{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div className={`w-full bg-white/10 rounded-full overflow-hidden ${sizes[size]}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${color} rounded-full relative`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent 
            animate-shimmer" />
        </motion.div>
      </div>
    </div>
  );
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg glass-card p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-6">{title}</h3>
        {children}
      </motion.div>
    </motion.div>
  );
}
