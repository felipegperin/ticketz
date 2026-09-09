import { Sequelize, Op } from "sequelize";
import Contact from "../../models/Contact";
import {
  buildPhoneCandidates,
  FULL_NUMBER_MIN_DIGITS
} from "../../helpers/ContactSearchPhone";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  companyId: number;
}

interface Response {
  contacts: Contact[];
  count: number;
  hasMore: boolean;
}

function buildWhereCondition(searchTerm: string, companyId: number) {
  const onlyDigits = searchTerm.replace(/\D/g, "");
  const escaped = searchTerm.replace(/'/g, "''");

  const nameCondition = {
    name: Sequelize.where(
      Sequelize.fn(
        "LOWER",
        Sequelize.fn("UNACCENT", Sequelize.col("Contact.name"))
      ),
      {
        [Op.like]: Sequelize.literal(`'%' || UNACCENT('${escaped}') || '%'`)
      }
    )
  };

  const companyCondition = {
    companyId: {
      [Op.eq]: companyId
    }
  };

  // Busca sem nenhum dígito (por nome, ou vazia) não tem condição de telefone
  // a aplicar. Incluir uma aqui casaria com todo contato e anularia o filtro
  // de nome, retornando a base inteira.
  if (!onlyDigits) {
    return {
      ...nameCondition,
      ...companyCondition
    };
  }

  const phoneCondition =
    onlyDigits.length >= FULL_NUMBER_MIN_DIGITS
      ? { number: { [Op.in]: buildPhoneCandidates(onlyDigits) } }
      : { number: { [Op.like]: `%${onlyDigits}%` } };

  return {
    [Op.or]: [nameCondition, phoneCondition],
    ...companyCondition
  };
}

const ListContactsService = async ({
  searchParam = "",
  pageNumber = "1",
  companyId
}: Request): Promise<Response> => {
  const normalizedSearchParam = searchParam.toLowerCase().trim();
  const whereCondition = buildWhereCondition(normalizedSearchParam, companyId);

  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: contacts } = await Contact.findAndCountAll({
    where: whereCondition,
    include: ["tags"],
    limit,
    offset,
    order: [[Sequelize.col("Contact.name"), "ASC"]]
  });

  const hasMore = count > offset + contacts.length;

  return {
    contacts,
    count,
    hasMore
  };
};

export default ListContactsService;
