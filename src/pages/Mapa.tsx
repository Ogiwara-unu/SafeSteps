import MapaComercios from "../components/location/MapaCanchas"; 

import {   IonPage   } from "@ionic/react";
 

const Mapas: React.FC = () => {
  return (
    <IonPage>
      <h1>SafeSteps Map</h1> 
        <MapaComercios /> 
    </IonPage>
  );
};

export default Mapas;
