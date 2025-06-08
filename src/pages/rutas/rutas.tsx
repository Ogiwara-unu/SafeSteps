import Sidebar from "../../components/SideBar/SideBar";
import {   IonPage   } from "@ionic/react";
 

const Rutas: React.FC = () => {
  return (
    <IonPage>
      <h1>Mis Rutas</h1> 
     <Sidebar/>
    </IonPage>
  );
};

export default Rutas;
