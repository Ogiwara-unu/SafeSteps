import { IonButton, IonIcon } from "@ionic/react";
import { createOutline, trashOutline, radioButtonOnOutline, radioButtonOffOutline } from "ionicons/icons";

interface MarkerListProps {
  markers: Marker[];
  onEdit: (marker: Marker) => void;
  onDelete: (id: string) => void;
  selectedMarkers: string[];
  onToggleSelect: (id: string) => void;
}

export const MarkerList: React.FC<MarkerListProps> = ({ 
  markers, 
  onEdit, 
  onDelete,
  selectedMarkers,
  onToggleSelect
}) => {
  return (
    <div style={{
      background: "#fff",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      padding: "8px",
      maxWidth: "250px"
    }}>
      <strong style={{ fontSize: 14, color: "#222", display: "block", padding: "4px 8px" }}>Marcadores</strong>
      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        {markers.map((marker) => (
          <div 
            key={marker.id} 
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px",
              borderBottom: "1px solid #eee",
              backgroundColor: selectedMarkers.includes(marker.id) ? "#e3f2fd" : "transparent"
            }}
          >
            <IonButton 
              fill="clear" 
              size="small" 
              onClick={() => onToggleSelect(marker.id)}
              style={{ marginRight: "4px" }}
            >
              <IonIcon 
                icon={selectedMarkers.includes(marker.id) ? radioButtonOnOutline : radioButtonOffOutline} 
                color={selectedMarkers.includes(marker.id) ? "primary" : "medium"}
              />
            </IonButton>
            
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ 
                margin: 0, 
                fontWeight: 500,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: "#000"
              }}>
                {marker.name}
              </p>
              <p style={{ 
                margin: 0, 
                fontSize: "12px",
                color: "#666"
              }}>
                {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
              </p>
            </div>

            <IonButton 
              fill="clear" 
              size="small" 
              onClick={() => onEdit(marker)}
            >
              <IonIcon icon={createOutline} />
            </IonButton>
            
            <IonButton 
              fill="clear" 
              size="small" 
              color="danger" 
              onClick={() => onDelete(marker.id)}
            >
              <IonIcon icon={trashOutline} />
            </IonButton>
          </div>
        ))}
      </div>
    </div>
  );
};