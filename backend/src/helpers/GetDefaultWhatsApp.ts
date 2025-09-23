import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";
import WhatsappQueue from "../models/WhatsappQueue";
import { logger } from "../utils/logger";

const GetDefaultWhatsApp = async (
  companyId: number,
  queueId?: number
): Promise<Whatsapp> => {
  let whatsapp: Whatsapp | null = null;

  if (queueId) {
    // Busca todos os WhatsApps vinculados a essa fila
    const whatsapps = await Whatsapp.findAll({
      where: {
        companyId,
        channel: "whatsapp",
        status: "CONNECTED"
      },
      include: [
        {
          model: WhatsappQueue,
          where: { queueId }
        }
      ]
    });

    if (whatsapps.length > 0) {
      // Se tem mais de um, escolhe randomicamente
      const randomIndex = Math.floor(Math.random() * whatsapps.length);
      whatsapp = whatsapps[randomIndex];
    }
  }

  if (!whatsapp) {
    // Se não encontrou pela fila, segue lógica existente
    whatsapp = await Whatsapp.findOne({
      where: {
        isDefault: true,
        companyId,
        channel: "whatsapp",
        status: "CONNECTED"
      }
    });

    if (!whatsapp) {
      logger.info(
        "No default WhatsApp found, falling back to any connected WhatsApp"
      );
      whatsapp = await Whatsapp.findOne({
        where: {
          companyId,
          channel: "whatsapp",
          status: "CONNECTED"
        }
      });
    }
  }

  if (!whatsapp) {
    throw new AppError("ERR_NO_DEF_WAPP_FOUND");
  }

  return whatsapp;
};

export default GetDefaultWhatsApp;
