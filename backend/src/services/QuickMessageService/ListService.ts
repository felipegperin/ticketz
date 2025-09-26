import { Sequelize, Op } from "sequelize";
import QuickMessage from "../../models/QuickMessage";
import User from "../../models/User";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  companyId: number | string;
  userId: number | string;
}

interface Response {
  records: QuickMessage[];
  count: number;
  hasMore: boolean;
}

const ListService = async ({
  searchParam = "",
  pageNumber = "1",
  companyId,
  userId
}: Request): Promise<Response> => {
  const companyIdNum = Number(companyId);
  const userIdNum = Number(userId);

  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  // 🔑 Busca todos IDs dos admins da mesma company
  const admins = await User.findAll({
    attributes: ["id"],
    where: {
      companyId: companyIdNum,
      profile: "admin"
    }
  });
  const adminIds = admins.map(a => a.id);

  // 🔑 Monta where
  const whereCondition: any = {
    companyId: companyIdNum,
    userId: {
      [Op.or]: [userIdNum, ...adminIds]
    }
  };

  if (searchParam.trim()) {
    whereCondition[Op.or] = [
      Sequelize.where(
        Sequelize.fn("LOWER", Sequelize.col("shortcode")),
        {
          [Op.like]: `%${searchParam.toLowerCase().trim()}%`
        }
      )
    ];
  }

  const { count, rows: records } = await QuickMessage.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [["shortcode", "ASC"]]
  });

  const hasMore = count > offset + records.length;

  return {
    records,
    count,
    hasMore
  };
};

export default ListService;
