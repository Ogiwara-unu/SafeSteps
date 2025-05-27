import { IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle } from '@ionic/react';
import './TopBar.css';

const Topbar = () => {
  return (
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonMenuButton className="custom-menu-button" />
        </IonButtons>

        <IonButtons slot="end">
          <div className="logo-container">
            <img src="/assets/IsotipoBlanco.png" alt="Logo" className="logo" />
          </div>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
};

export default Topbar;
