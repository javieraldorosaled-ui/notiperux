import React from 'react';
import { X } from 'lucide-react';

interface CloseModalButtonProps {
  onClose: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  ariaLabel?: string;
  className?: string;
  size?: 'normal' | 'compact';
}

/**
 * Botón global de cierre estandarizado para toda la aplicación.
 * Cumple rigurosamente con la regla global:
 * 1. X ROJA (#C62828) claramente visible y destacada del fondo.
 * 2. Tamaño visual de la X aproximado de 24–28 px (w-[26px] h-[26px] con trazo grueso stroke-[2.75px]).
 * 3. Área táctil mínima de 44 × 44 px para facilitar su uso en dispositivos móviles.
 * 4. Ubicado en la esquina superior derecha del modal o panel.
 * 5. Mismo diseño consistente y alto contraste sobre fondos verde claro (#E6F1DE, #D8EACF), beige (#FDEDD4, #F2F8ED) o blanco.
 * 6. Ejecuta exactamente la misma función de cierre que ya tiene actualmente.
 */
export const CloseModalButton: React.FC<CloseModalButtonProps> = ({
  onClose,
  ariaLabel = 'Cerrar',
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose(e);
      }}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#FFEBEE] hover:bg-[#FFCDD2] active:bg-[#EF9A9A] border-2 border-[#EF9A9A] hover:border-[#E57373] text-[#C62828] shadow-[0_2px_6px_rgba(198,40,40,0.18)] flex items-center justify-center shrink-0 transition-all duration-150 active:scale-95 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C62828] ${className}`}
    >
      <X
        className="w-[26px] h-[26px] text-[#C62828] stroke-[2.75px] shrink-0"
      />
    </button>
  );
};
