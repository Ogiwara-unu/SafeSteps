import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Home from './pages/Home';
import Login from './pages/login/Login';
import Register from './pages/login/Register';
import { MostrarDatosUsuario } from './pages/Configuración/config';
import AcercaDe from './pages/AcercaDe/acerca';
import Mapas from './pages/Mapa';
import { CompartirUbi } from './pages/compartirUbicacionP/compartirUbicacion';
import UbicacionesRecibidasPage from './pages/UbicacionesRecibidas/UbicacionesRecibidas';
import OfflineBanner from './components/OfflineBanner/OfflineBanner';


/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import { OfflineProvider } from './contexts/OfflineContext';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
/*import '@ionic/react/css/palettes/dark.system.css';*/

/* Theme variables */
//import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => (
  <OfflineProvider>
    <IonApp>
      <OfflineBanner />
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/home">
            <Home />
          </Route>
          <Route exact path="/login">
            <Login />
          </Route>
          <Route exact path="/register">
            <Register />
          </Route>
          <Route exact path="/">
            <Redirect to="/login" />
          </Route>
          <Route exact path="/config">
          <MostrarDatosUsuario/>
          </Route>
          <Route exact path="/acerca">
          <AcercaDe/>
          </Route>
          <Route exact path="/mapas">
            <Mapas/>
          </Route>
          <Route exact path="/compartirUbicacion">
            <CompartirUbi/>
          </Route>
          <Route exact path="/ubicacionesRecibidas">
            <UbicacionesRecibidasPage/>
          </Route>

        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  </OfflineProvider>
);

export default App;
