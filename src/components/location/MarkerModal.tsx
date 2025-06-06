import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton } from "@ionic/react";
import { Marker } from "../../hooks/useMarkers";
import { useState, useEffect } from "react";

interface MarkerModalProps {
  isOpen: boolean;
  initialName?: string;
  onClose: () => void;
  onSave: (name: string) => void;
  editing?: boolean;
}

export const MarkerModal: React.FC<MarkerModalProps> = ({ isOpen, initialName = "", onClose, onSave, editing }) => {
  const [name, setName] = useState(initialName);

  useEffect(() => { setName(initialName); }, [initialName, isOpen]);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="custom-marker-modal" backdropDismiss={true}>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontSize: 18, textAlign: "center" }}>
            {editing ? "Editar marcador" : "Agregar marcador"}
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: 16 }}>
          <IonInput
            label="Nombre"
            labelPlacement="floating"
            placeholder="Ej: Parque, Panadería..."
            value={name}
            onIonInput={e => setName(e.detail.value ?? "")}
            clearInput
            style={{ fontSize: 16 }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24, gap: 8 }}>
            <IonButton onClick={onClose} color="medium">Cancelar</IonButton>
            <IonButton onClick={() => onSave(name)} disabled={!name.trim()}>
              {editing ? "Guardar" : "Agregar"}
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};