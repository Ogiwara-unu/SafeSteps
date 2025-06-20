import { IonMenu, IonContent, IonList, IonItem, IonMenuToggle } from '@ionic/react';
import ToggleOffline from '../toggleoffline/toggleoffline'; // Ruta ajustada
import './SideBar.css';

const Sidebar = () => {
  return (
    <IonMenu contentId="main-content" type="overlay">
      <IonContent className="menu-content">
        <IonList>
          <IonMenuToggle autoHide={false}>
            <IonItem routerLink="/home">Inicio</IonItem>
            <IonItem routerLink="/mapas">Mapa</IonItem>
            <IonItem routerLink="/rutas">Rutas guardadas</IonItem>
            <IonItem routerLink="/compartirUbicacion">Compartir Ubicación</IonItem>
            <IonItem routerLink="/config">Configuración</IonItem>
            <IonItem routerLink="/acerca">Acerca de</IonItem>
            <IonItem routerLink="/ubicacionesRecibidas">Ubicaciones Recibidas</IonItem>

            {/* Botón de modo offline */}
            <ToggleOffline />
          </IonMenuToggle>
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default Sidebar;