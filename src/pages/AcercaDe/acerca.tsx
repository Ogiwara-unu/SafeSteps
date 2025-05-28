import {
    IonPage,
    IonContent,
    IonText
} from '@ionic/react';
import Topbar from '../../components/TopBar/TopBar';
import Sidebar from '../../components/SideBar/SideBar';
import './acerca.css';

const AcercaDe = () => {
    return (
        <>
            <Sidebar />
            <IonPage id="main-content">
                <Topbar />
                <IonContent className="about-content">
                    <div className="about-container">
                        <img src="/assets/Imagotipo.png" alt="Logo de la app" className="about-logo" />

                        <h2>Sobre la Aplicación</h2>
                        <p>
                            Esta aplicación fue desarrollada con el objetivo de facilitar la visualización y
                            gestión de rutas y ubicaciones en tiempo real.
                        </p>

                        <h3>Desarrolladores</h3>
                        <ul>
                            <li>Jafeth Peña</li>
                            <li>Randall Álvarez</li>
                            <li>Valeria Fernández</li>
                            <li>Christian Villalobos</li>

                        </ul>

                        <h3>Versión</h3>
                        <p>1.0.0</p>

                        <h3>Contacto</h3>
                        <p>safesteps@app.com</p>
                    </div>
                </IonContent>
            </IonPage>
        </>
    );
};

export default AcercaDe;
