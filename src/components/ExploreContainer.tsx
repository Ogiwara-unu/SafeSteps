import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonImg
} from '@ionic/react';
import './ExploreContainer.css';

const ExploreContainer: React.FC = () => {
  return (
    <div id="container">
      <div className="welcome-section">
        <h2>Explora con confianza. Camina con seguridad.</h2>
        <p>
          Bienvenido a <strong>SafeSteps</strong>, tu compañero ideal para senderismo seguro.
          Rastrea tu ruta, marca puntos de interés y mantén informados a tus seres queridos,
          incluso sin conexión.
        </p>
        <IonButton className="start-button">Iniciar</IonButton>
      </div>

      <div className="gallery-section">
        <h3>Colecciona momentos únicos con SafeSteps</h3>
        <div className="gallery">
          <IonImg src="/assets/senderismo1.png" alt="Senderismo 1" />
          <IonImg src="/assets/senderismo2.png" alt="Senderismo 2" />
        </div>
      </div>
    </div>
  );
};

export default ExploreContainer;
