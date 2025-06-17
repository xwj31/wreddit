type InputProps = {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
  className?: string;
};

export const Input = ({ 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  onEnter, 
  className = "" 
}: InputProps) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onKeyPress={(e) => e.key === "Enter" && onEnter?.()}
    className={`px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm ${className}`}
  />
);