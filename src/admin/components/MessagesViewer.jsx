import { useState, useEffect } from 'react';
import { FiMail, FiUser, FiCalendar, FiMessageSquare } from 'react-icons/fi';
import { getMessages } from '../../firebase/services/messages';

const MessagesViewer = () => {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    const result = await getMessages();
    if (result.success) {
      setMessages(result.data);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 rounded-2xl border border-primary/10 bg-white/60 p-6 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/60">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-linkDark/10 dark:text-linkDark">
          <FiMail size={18} />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-primary dark:text-linkDark">Mensajes de Contacto</h2>
          <p className="mt-1 text-sm text-linkLight/80 dark:text-linkDark/80">
            Mensajes recibidos desde el formulario de contacto del sitio.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-primary dark:text-linkDark">Lista de mensajes</h3>
            <span className="text-xs uppercase tracking-widest text-linkLight/60 dark:text-linkDark/60">
              {messages.length} mensajes
            </span>
          </div>
          <div className="max-h-[600px] space-y-2 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-linkLight/60 dark:text-linkDark/60">Cargando mensajes...</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-linkLight/60 dark:text-linkDark/60">
                No hay mensajes recibidos aún.
              </p>
            ) : (
              messages.map((message) => (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => setSelectedMessage(message)}
                  className={`w-full rounded-xl border p-4 text-left transition-colors duration-200 ${
                    selectedMessage?.id === message.id
                      ? 'border-primary bg-primary/10 dark:border-linkDark dark:bg-linkDark/10'
                      : 'border-primary/10 bg-white/80 hover:border-primary/20 dark:border-primary/20 dark:bg-darkBg/70 dark:hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="truncate font-semibold text-primary dark:text-linkDark">
                        {message.subject || 'Sin asunto'}
                      </h4>
                      <p className="mt-1 truncate text-xs text-linkLight/70 dark:text-linkDark/70">
                        {message.name}
                      </p>
                      <p className="mt-1 text-xs text-linkLight/60 dark:text-linkDark/60">
                        {message.formattedDate}
                      </p>
                    </div>
                    {!message.read && (
                      <span className="h-2 w-2 rounded-full bg-primary dark:bg-linkDark" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-primary/10 bg-white/80 p-6 transition-colors duration-200 dark:border-primary/20 dark:bg-darkBg/70">
          {selectedMessage ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-primary dark:text-linkDark">
                  {selectedMessage.subject || 'Sin asunto'}
                </h3>
                <div className="mt-2 flex items-center gap-4 text-xs uppercase tracking-widest text-linkLight/60 dark:text-linkDark/60">
                  <span className="flex items-center gap-1">
                    <FiCalendar size={12} />
                    {selectedMessage.formattedDate}
                  </span>
                </div>
              </div>

              <div className="space-y-3 border-t border-primary/10 pt-4 dark:border-primary/20">
                <div>
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                    <FiUser size={14} />
                    Remitente
                  </div>
                  <p className="text-sm text-linkLight dark:text-linkDark">{selectedMessage.name}</p>
                  <a
                    href={`mailto:${selectedMessage.email}`}
                    className="text-sm text-primary hover:text-accent dark:text-linkDark dark:hover:text-primary"
                  >
                    {selectedMessage.email}
                  </a>
                </div>

                <div>
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                    <FiMessageSquare size={14} />
                    Mensaje
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-linkLight/90 dark:text-linkDark/90">
                    {selectedMessage.message}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                  className="btn-gradient inline-flex items-center gap-2 text-xs uppercase"
                >
                  <FiMail size={16} />
                  Responder
                </a>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-linkLight/60 dark:text-linkDark/60">
                Seleccioná un mensaje para ver los detalles
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesViewer;
