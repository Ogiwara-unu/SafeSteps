import { IonMenu, IonContent, IonList, IonItem, IonMenuToggle } from '@ionic/react';
import './SideBar.css';
import NotificationIcon from '../notification/notificationicon';

const Sidebar = () => {
  return (
    <IonMenu contentId="main-content" type="overlay">
      <IonContent className="menu-content">
        <IonList>
          <IonMenuToggle autoHide={false}>
            <NotificationIcon/>
            <IonItem routerLink="/home">Inicio</IonItem>
            <IonItem routerLink="/mapas">Mapa</IonItem>
            <IonItem routerLink="/compartirUbicacion">Compartir Ubicación</IonItem>
            <IonItem routerLink="/ubicacionesRecibidas">Ubicaciones Recibidas</IonItem>
            <IonItem routerLink="/config">Configuración</IonItem>
            <IonItem routerLink="/acerca">Acerca de</IonItem>
            

            
          </IonMenuToggle>
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default Sidebar;