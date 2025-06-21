import React, { useState, useEffect, useCallback } from "react";
import { IonList, IonItem, IonLabel, IonToggle, IonToast, IonLoading } from "@ionic/react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications, Token } from "@capacitor/push-notifications";
import { functionUrl } from "../../models/constantes";
import { loadUserPreferences, saveUserPreferences } from "../../services/notification/index";

interface Topic {
  id: string;
  name: string;
  subscribed: boolean;
}

const TopicSubscription: React.FC = () => {
  const [topics, setTopics] = useState<Topic[]>([
    { id: "deportes", name: "Deportes", subscribed: false },
    { id: "ciencia", name: "Ciencias", subscribed: false },
    { id: "natural", name: "Natural", subscribed: false },
  ]);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const loadUserPreferencesNotif = async (token: string) => {
    const subscribedTopics = await loadUserPreferences(token);
    setTopics((prev) => prev.map((t) => ({ ...t, subscribed: subscribedTopics.includes(t.id) })));
  };

  const initializePushNotifications = useCallback(async () => {
    setIsInitializing(true);

    if (Capacitor.getPlatform() === "web") {
      console.warn("Push not supported on web");
      setIsInitializing(false);
      return;
    }

    try {
      const permStatus = await PushNotifications.requestPermissions();
      if (permStatus.receive !== "granted") {
        throw new Error("Permission not granted");
      }

      PushNotifications.addListener("registration", async ({ value }: Token) => {
        setFcmToken(value);
        await loadUserPreferencesNotif(value);
        setIsInitializing(false);
      });

      PushNotifications.addListener("registrationError", (error) => {
        throw error;
      });

      await PushNotifications.register();
    } catch (error) {
      console.error("Initialization error:", error);
      setToastMessage(`Error: ${error}`);
      setShowToast(true);
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    initializePushNotifications();
    return () => PushNotifications.removeAllListeners();
  }, [initializePushNotifications]);

  const handleToggle = async (topicId: string) => {
    if (!fcmToken || isToggling) return;
    setIsToggling(topicId);

    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return;

    const action = topic.subscribed ? "unsubscribe" : "subscribe";

    try {
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: fcmToken, topic: topicId, action }),
      });

      if (!response.ok) {
        alert("error al response");
        const errorResponse = await response.json();
        throw new Error(`Error: ${errorResponse.error}`);
      }

      setTopics((prev) => prev.map((t) => (t.id === topicId ? { ...t, subscribed: !t.subscribed } : t)));

      const updatedTopics = topics
        .map((t) => (t.id === topicId ? { ...t, subscribed: !t.subscribed } : t))
        .filter((t) => t.subscribed)
        .map((t) => t.id);

      saveUserPreferences(fcmToken, updatedTopics);

      setToastMessage(`${action === "subscribe" ? "Suscrito" : "Desuscrito"} a ${topic.name}`);
    } catch (error) {
      console.error("Error toggling subscription:", error);
      setToastMessage(`Error: ${error}`);
    } finally {
      setShowToast(true);
      setIsToggling(null);
    }
  };

  return (
    <>
      {isInitializing ? (
        <IonLoading isOpen={true} message='Inicializando notificaciones...' />
      ) : (
        <IonList>
          {topics.map((topic) => (
            <IonItem key={topic.id}>
              <IonLabel>{topic.name}</IonLabel>
              <IonToggle checked={topic.subscribed} disabled={isToggling === topic.id} onIonChange={() => handleToggle(topic.id)} />
            </IonItem>
          ))}
        </IonList>
      )}
      <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMessage} duration={3000} />
    </>
  );
};

export default TopicSubscription;
