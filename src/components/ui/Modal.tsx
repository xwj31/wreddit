import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-900">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
};