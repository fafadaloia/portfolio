import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config';

const MESSAGES_COLLECTION = 'portfolio/admin/messages';

// Convertir mensaje de Firebase a formato del frontend
const firebaseToFrontend = (firebaseDoc) => {
  const data = firebaseDoc.data();
  const receivedAt = data.receivedAt?.toDate
    ? data.receivedAt.toDate()
    : data.receivedAt
    ? new Date(data.receivedAt)
    : new Date();

  return {
    id: firebaseDoc.id,
    name: data.name || '',
    email: data.mail || '',
    subject: data.subject || 'Sin asunto',
    message: data.message || '',
    receivedAt: receivedAt.toISOString(),
    formattedDate: receivedAt.toLocaleString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
};

export const sendMessage = async (name, email, message, subject = 'Mensaje desde contacto') => {
  if (!db) {
    return { success: false, error: 'Firebase no está configurado' };
  }
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    await addDoc(messagesRef, {
      name: name || '',
      mail: email || '',
      message: message || '',
      subject: subject || 'Mensaje desde contacto',
      receivedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getMessages = async () => {
  if (!db) {
    return { success: true, data: [] };
  }
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(messagesRef, orderBy('receivedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs.map(firebaseToFrontend);
    return { success: true, data: messages };
  } catch (error) {
    return { success: false, error: error.message, data: [] };
  }
};
