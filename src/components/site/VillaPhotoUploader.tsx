import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type VillaPhotoUploaderProps = {
  images: string[];
  onChange: (images: string[]) => void;
};

export function VillaPhotoUploader({ images, onChange }: VillaPhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [showManualTextarea, setShowManualTextarea] = useState(false);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setUploading(true);
    setProgress({ current: 0, total: files.length });

    const newUrls: string[] = [];

    let currentIndex = 0;
    for (const file of files) {
      currentIndex += 1;
      setProgress({ current: currentIndex, total: files.length });

      try {
        const ext = file.name.split(".").pop() || "jpg";
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const filePath = `villas/${fileName}`;

        // Tentative d'upload sur Supabase Storage (bucket "villa-images")
        const { data, error } = await supabase.storage
          .from("villa-images")
          .upload(filePath, file, { cacheControl: "3600", upsert: true });

        if (!error && data) {
          const { data: pubData } = supabase.storage.from("villa-images").getPublicUrl(filePath);
          if (pubData?.publicUrl) {
            newUrls.push(pubData.publicUrl);
            continue;
          }
        }

        // Si le bucket n'existe pas encore ou retourne une erreur, lire en Data URL local
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        newUrls.push(dataUrl);
      } catch (err) {
        console.error("Erreur lors de l'upload du fichier:", err);
        toast.error(`Impossible de charger la photo ${file.name}`);
      }
    }

    setUploading(false);
    setProgress(null);
    if (e.target) e.target.value = "";

    if (newUrls.length > 0) {
      onChange([...images, ...newUrls]);
      toast.success(`${newUrls.length} photo(s) ajoutée(s) !`);
    }
  }

  function removeImage(index: number) {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
    toast.info("Photo retirée de la sélection");
  }

  function makeCover(index: number) {
    if (index <= 0) return;
    const updated = [...images];
    const [selected] = updated.splice(index, 1);
    if (selected) {
      updated.unshift(selected);
      onChange(updated);
      toast.success("Photo définie comme image de couverture !");
    }
  }

  const field = "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm";

  return (
    <div className="space-y-4 rounded-3xl border border-border bg-secondary/20 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base text-foreground">Photos de la villa</h3>
          <p className="text-xs text-muted-foreground">
            Sélectionnez une ou plusieurs photos depuis votre galerie photo (mobile ou ordinateur).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gradient-lagoon rounded-full px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-soft transition-all duration-300 hover:brightness-110 disabled:opacity-50"
          >
            <i className="fa-solid fa-camera mr-2" aria-hidden="true" />
            {uploading ? "Envoi en cours..." : "Ajouter des photos"}
          </button>
          <button
            type="button"
            onClick={() => setShowManualTextarea(!showManualTextarea)}
            className="rounded-full border border-border bg-background px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <i className="fa-solid fa-link mr-1.5" aria-hidden="true" />
            {showManualTextarea ? "Masquer les URL" : "URL manuels"}
          </button>
        </div>
      </div>

      {/* Input de fichier masqué avec accept="image/*" et multiple pour ouvrir la galerie photo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Zone d'upload / Barre de chargement */}
      {uploading && (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm font-semibold text-primary animate-pulse">
          <i className="fa-solid fa-spinner fa-spin text-xl" aria-hidden="true" />
          <div className="flex-1">
            <p>
              Upload des photos en cours ({progress?.current} / {progress?.total})...
            </p>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: `${((progress?.current ?? 0) / (progress?.total ?? 1)) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Zone d'aperçu des miniatures avec boutons d'action */}
      {images.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {images.length} photo{images.length > 1 ? "s" : ""} sélectionnée
            {images.length > 1 ? "s" : ""} (la 1ère photo sera la photo de couverture) :
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {images.map((url, index) => (
              <div
                key={`${url.slice(0, 30)}-${index}`}
                className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted shadow-soft transition-all duration-200 hover:border-primary/50"
              >
                <img src={url} alt={`Photo ${index + 1}`} className="size-full object-cover" />

                {index === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground shadow">
                    Couverture
                  </span>
                )}

                {/* Overlays d'action sur survol / clic mobile */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
                  {index > 0 && (
                    <button
                      type="button"
                      title="Définir comme photo de couverture"
                      onClick={() => makeCover(index)}
                      className="rounded-full bg-white/90 p-2 text-xs text-foreground transition-transform hover:scale-110 hover:bg-white"
                    >
                      <i className="fa-solid fa-star text-amber-500" aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Retirer cette photo"
                    onClick={() => removeImage(index)}
                    className="rounded-full bg-destructive p-2 text-xs text-destructive-foreground transition-transform hover:scale-110"
                  >
                    <i className="fa-solid fa-trash" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background p-8 text-center transition-colors hover:border-primary hover:bg-secondary/40"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <i className="fa-solid fa-cloud-arrow-up text-xl" aria-hidden="true" />
          </div>
          <p className="mt-3 font-semibold text-sm">Cliquez ici pour ouvrir votre galerie photo</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Sélectionnez une ou plusieurs images (JPG, PNG, WebP)
          </p>
        </div>
      )}

      {/* Zone de texte manuelle optionnelle */}
      {showManualTextarea && (
        <div className="space-y-1.5 pt-2">
          <label className="text-xs text-muted-foreground">
            Saisie/Edition manuelle des URL (une URL par ligne) :
          </label>
          <textarea
            className={`${field} min-h-24 font-mono text-xs`}
            placeholder="https://images.unsplash.com/..."
            value={images.join("\n")}
            onChange={(e) =>
              onChange(
                e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </div>
      )}
    </div>
  );
}
