import React, { useState, useRef } from 'react';
import { X, Send, AlertCircle, Camera, Check, Sparkles, Trash2 } from 'lucide-react';
import { CloseModalButton } from './CloseModalButton';
import { CommunityReport, PriceItem } from '../types';
import { BASELINE_PRODUCTS } from '../services/baselineData';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport: (
    report: Omit<CommunityReport, 'id' | 'createdAt' | 'isVerified'> & {
      productId?: string;
      address?: string;
    }
  ) => void;
  initialType?: 'price' | 'offer';
  catalogProducts?: PriceItem[];
}

function compressImageToJpeg(file: File, maxSide = 800, quality = 0.65): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('No se pudo procesar la imagen'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxSide || height > maxSide) {
          if (width >= height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSubmitReport,
  initialType = 'price',
  catalogProducts,
}) => {
  const [reportType, setReportType] = useState<'price' | 'offer'>(initialType);
  const [product, setProduct] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [price, setPrice] = useState('');
  const [previousPrice, setPreviousPrice] = useState('');
  const [storeName, setStoreName] = useState('');
  const [district, setDistrict] = useState('Huánuco Cercado');
  const [location, setLocation] = useState('');
  const [comment, setComment] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const availableCatalog =
    catalogProducts && catalogProducts.length > 0 ? catalogProducts : BASELINE_PRODUCTS;

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressingPhoto(true);
    try {
      const compressedDataUrl = await compressImageToJpeg(file, 800, 0.65);
      setPhotoPreview(compressedDataUrl);
    } catch (err) {
      console.warn('Error al comprimir imagen:', err);
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectCatalogProduct = (item: PriceItem) => {
    setProduct(item.name);
    setSelectedProductId(item.id);
    if (!storeName && item.storeOrMarket) {
      setStoreName(item.storeOrMarket);
    }
    if (item.district) {
      setDistrict(item.district);
    }
  };

  const handleProductInputChange = (value: string) => {
    setProduct(value);
    const matched = availableCatalog.find(
      (item) => item.name.trim().toLowerCase() === value.trim().toLowerCase()
    );
    setSelectedProductId(matched ? matched.id : undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !price || !storeName || isCompressingPhoto) return;

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('es-PE')} · ${now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;

    let authorId = localStorage.getItem('huanuco_user_client_id');
    if (!authorId) {
      authorId = 'usr-' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('huanuco_user_client_id', authorId);
    }

    const matchedCatalog =
      selectedProductId ||
      availableCatalog.find(
        (item) => item.name.trim().toLowerCase() === product.trim().toLowerCase()
      )?.id;

    const cleanAddress = location.trim();

    onSubmitReport({
      type: reportType,
      productId: matchedCatalog,
      product: product.trim(),
      price: parseFloat(price),
      previousPrice: previousPrice ? parseFloat(previousPrice) : undefined,
      storeName: storeName.trim(),
      district,
      address: cleanAddress || district,
      location: cleanAddress || district,
      date: formattedDate,
      comment: comment.trim(),
      trustLevel: 'reported',
      status: 'PENDIENTE',
      photoUrl: photoPreview || undefined,
      authorId,
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
      // Reset form
      setProduct('');
      setSelectedProductId(undefined);
      setPrice('');
      setPreviousPrice('');
      setStoreName('');
      setLocation('');
      setComment('');
      setPhotoPreview(null);
    }, 1700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#102610]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#F2F8ED] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-[#BAD0B5] max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-10 h-1.5 bg-[#BAD0B5] rounded-full mx-auto mb-3 sm:hidden" />

        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#165338] uppercase tracking-wider mb-0.5">
              <Sparkles className="w-3.5 h-3.5 text-[#165338]" />
              <span>Comunidad de Huánuco</span>
            </div>
            <h2 className="text-base font-bold text-[#102610] leading-tight">
              {reportType === 'price' ? 'Reportar Precio' : 'Reportar Oferta'}
            </h2>
            <p className="text-xs text-[#56654F] mt-0.5">
              Avisa un precio nuevo o rebaja encontrada en tu puesto o grifo
            </p>
          </div>
          <CloseModalButton onClose={onClose} ariaLabel="Cerrar reporte" />
        </div>

        {submitted ? (
          <div className="py-10 text-center space-y-2 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-[#D8EACF] text-[#165338] border border-[#BAD0B5] flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 stroke-[3px]" />
            </div>
            <h3 className="text-base font-bold text-[#102610]">
              ¡Reporte enviado a la base de datos!
            </h3>
            <p className="text-xs text-[#56654F] max-w-xs mx-auto leading-relaxed">
              Guardado con estado <strong className="text-[#165338]">PENDIENTE</strong>. Se verificará antes de publicarse como precio comprobado.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#D8EACF] rounded-2xl border border-[#BAD0B5]">
              <button
                type="button"
                onClick={() => setReportType('price')}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  reportType === 'price'
                    ? 'bg-[#165338] text-white shadow-2xs'
                    : 'text-[#56654F] hover:text-[#102610]'
                }`}
              >
                📊 Precio habitual
              </button>
              <button
                type="button"
                onClick={() => setReportType('offer')}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  reportType === 'offer'
                    ? 'bg-[#165338] text-white shadow-2xs'
                    : 'text-[#56654F] hover:text-[#102610]'
                }`}
              >
                🔥 Oferta o rebaja
              </button>
            </div>

            {/* Product */}
            <div>
              <label className="block text-xs font-semibold text-[#102610] mb-1">
                Producto o Combustible *
              </label>
              <input
                type="text"
                required
                value={product}
                onChange={(e) => handleProductInputChange(e.target.value)}
                placeholder="Selecciona del catálogo o escribe un producto..."
                className="w-full px-3.5 py-2.5 bg-[#E6F1DE] border border-[#BAD0B5] rounded-xl text-xs text-[#102610] focus:bg-[#F2F8ED] focus:outline-none focus:border-[#165338] transition-colors"
              />
              {availableCatalog.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                  {availableCatalog.map((item) => {
                    const isSelected = selectedProductId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectCatalogProduct(item)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${
                          isSelected
                            ? 'bg-[#165338] text-white border-[#165338]'
                            : 'bg-[#FDEDD4] hover:bg-[#F1E5D3] text-[#102610] border-[#BAD0B5]'
                        }`}
                      >
                        {item.icon} {item.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Price & Previous Price */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-[#102610] mb-1">
                  Precio que viste (S/) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7A886F]">
                    S/
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2.5 bg-[#E6F1DE] border border-[#BAD0B5] rounded-xl text-xs text-[#165338] font-bold focus:bg-[#F2F8ED] focus:outline-none focus:border-[#165338]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102610] mb-1">
                  Precio anterior (opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7A886F]">
                    S/
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={previousPrice}
                    onChange={(e) => setPreviousPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2.5 bg-[#E6F1DE] border border-[#BAD0B5] rounded-xl text-xs text-[#56654F] focus:bg-[#F2F8ED] focus:outline-none focus:border-[#165338]"
                  />
                </div>
              </div>
            </div>

            {/* Store & District */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-[#102610] mb-1">
                  Tienda / Puesto / Grifo *
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Ej. Mercado Modelo puesto 14"
                  className="w-full px-3.5 py-2.5 bg-[#E6F1DE] border border-[#BAD0B5] rounded-xl text-xs text-[#102610] focus:bg-[#F2F8ED] focus:outline-none focus:border-[#165338]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102610] mb-1">
                  Distrito
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#E6F1DE] border border-[#BAD0B5] rounded-xl text-xs text-[#102610] focus:bg-[#F2F8ED] focus:outline-none focus:border-[#165338] font-medium"
                >
                  <option value="Huánuco Cercado">Huánuco Cercado</option>
                  <option value="Amarilis">Amarilis</option>
                  <option value="Pillco Marca">Pillco Marca</option>
                  <option value="Santa María del Valle">Santa María del Valle</option>
                  <option value="Otro">Otro distrito de Huánuco</option>
                </select>
              </div>
            </div>

            {/* Specific location */}
            <div>
              <label className="block text-xs font-semibold text-[#102610] mb-1">
                Dirección aproximada o referencia
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej. Jr. Huánuco cdra. 4, Puesto 12 carnes..."
                className="w-full px-3.5 py-2.5 bg-[#E6F1DE] border border-[#BAD0B5] rounded-xl text-xs text-[#102610] focus:bg-[#F2F8ED] focus:outline-none focus:border-[#165338]"
              />
            </div>

            {/* Photo Upload (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-[#102610] mb-1">
                Foto opcional (pizarra, cartel o comprobante)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                className="hidden"
                id="photo-file-input"
              />

              {!photoPreview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-3 bg-[#E6F1DE] hover:bg-[#D8EACF] rounded-2xl border border-dashed border-[#BAD0B5] flex items-center justify-center gap-2 text-xs text-[#56654F] transition-colors"
                >
                  <Camera className="w-4 h-4 text-[#165338]" />
                  <span>Tomar foto o subir desde celular</span>
                </button>
              ) : (
                <div className="relative p-2 bg-[#FDEDD4] rounded-2xl border border-[#BAD0B5] flex items-center gap-3">
                  <img
                    src={photoPreview}
                    alt="Vista previa"
                    className="w-14 h-14 object-cover rounded-xl border border-[#BAD0B5]"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-[#102610] block">Foto adjunta</span>
                    <span className="text-[10px] text-[#56654F]">Lista para ser compartida</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-2 text-[#BF1C10] hover:bg-[#FDD9C5] rounded-xl transition-colors"
                    title="Quitar foto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-semibold text-[#102610] mb-1">
                Comentario
              </label>
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ej. Buena atención, hay bastante stock disponible..."
                className="w-full px-3.5 py-2 bg-[#E6F1DE] border border-[#BAD0B5] rounded-xl text-xs text-[#102610] focus:bg-[#F2F8ED] focus:outline-none focus:border-[#165338] resize-none"
              />
            </div>

            {/* Trust note */}
            <div className="p-2.5 bg-[#E6F1DE] border border-[#BAD0B5] rounded-xl flex items-center gap-2 text-[11px] text-[#56654F]">
              <AlertCircle className="w-3.5 h-3.5 text-[#7A886F] shrink-0" />
              <span>
                Los reportes se publican con el sello <strong>💬 Reportado por la comunidad</strong> para garantizar transparencia ciudadana.
              </span>
            </div>

            <button
              type="submit"
              id="btn-submit-report"
              className="w-full py-3 bg-[#165338] hover:bg-[#102610] active:scale-98 transition-all text-white font-semibold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ENVIAR REPORTE</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
