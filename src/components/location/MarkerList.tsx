import { IonButton, IonIcon } from "@ionic/react";
import { createOutline, trashOutline } from "ionicons/icons";
import { Marker } from "../../hooks/markers/useMarkers";

interface MarkerListProps {
  markers: Marker[];
  onEdit: (marker: Marker) => void;
  onDelete: (id: string) => void;
}

export const MarkerList: React.FC<MarkerListProps> = ({ markers, onEdit, onDelete }) => (
  <div style={{
    background: "#fff", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    padding: "8px", maxWidth: "180px", minWidth: "120px"
  }}>
    <strong style={{ fontSize: 13, color: "#222" }}>Marcadores</strong>
    <div style={{ maxHeight: "180px", overflowY: "auto" }}>
      {markers.map(marker => (
        <div key={marker.id} style={{
          borderBottom: "1px solid #eee", padding: "4px 0", display: "flex",
          alignItems: "center", justifyContent: "space-between"
        }}>
          <span style={{
            fontSize: 13, fontWeight: 500, color: "#222", overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 90
          }}>
            {marker.name || "(Sin nombre)"}
          </span>
          <div style={{ display: "flex", gap: "2px" }}>
            <IonButton size="small" fill="clear" onClick={() => onEdit(marker)}>
              <IonIcon icon={createOutline} />
            </IonButton>
            <IonButton size="small" fill="clear" color="danger" onClick={() => onDelete(marker.id)}>
              <IonIcon icon={trashOutline} />
            </IonButton>
          </div>
        </div>
      ))}
    </div>
  </div>
);