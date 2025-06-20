// src/components/ToggleOffline.tsx
import { IonItem, IonLabel, IonToggle } from '@ionic/react';
import { useOffline } from '../../contexts/OfflineContext';

const ToggleOffline = () => {
  const { isOffline, toggleOffline } = useOffline();

  return (
    <IonItem>
      <IonLabel>Modo Offline</IonLabel>
      <IonToggle 
        checked={isOffline} 
        disabled
        color="primary"
      />
    </IonItem>
  );
};

export default ToggleOffline;