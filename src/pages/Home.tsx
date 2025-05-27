import { IonContent, IonPage } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import Topbar from '../components/TopBar/TopBar';
import Sidebar from '../components/SideBar/SideBar';
import './Home.css';

const Home: React.FC = () => {
  return (
    <>
      <Sidebar />
      <IonPage id="main-content">
        <Topbar />
        <IonContent fullscreen>
          <ExploreContainer />
        </IonContent>
      </IonPage>
    </>
  );
};

export default Home;
