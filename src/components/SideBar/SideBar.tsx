import { IonMenu, IonContent, IonList, IonItem, IonMenuToggle } from '@ionic/react';
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
            <IonItem routerLink="/compartir">Compartir Ubicación</IonItem>
            <IonItem routerLink="/config">Configuración</IonItem>
            <IonItem routerLink="/acerca">Acerca de</IonItem>
          </IonMenuToggle>
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default Sidebar;
