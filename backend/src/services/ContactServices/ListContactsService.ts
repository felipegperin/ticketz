import { Sequelize, Op } from "sequelize";
import Contact from "../../models/Contact";

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

function normalizePhone(input: string): string[] {
	// remove tudo que não for número
	let digits = input.replace(/\D/g, "");

	// Se não começa com 55, adiciona
	if (!digits.startsWith("55")) {
	digits = "55" + digits;
	}

	// monta as duas versões
	const ddi = digits.substring(0, 2); // 55
	const ddd = digits.substring(2, 4); // ex: 44
	const rest = digits.substring(4);

	const withNine =
	ddi + ddd + (rest.startsWith("9") ? rest : "9" + rest);

	const withoutNine =
	ddi + ddd + (rest.startsWith("9") ? rest.substring(1) : rest);

	return [withNine, withoutNine];
}
function buildWhereCondition(normalizedSearchParam: string, companyId: number) {
	const onlyDigits = normalizedSearchParam.replace(/\D/g, "");
	let phoneCondition;
	if (onlyDigits.length >= 10) {
		// número completo → compara exato
		const phones = normalizePhone(normalizedSearchParam);
		phoneCondition = { number: { [Op.in]: phones } };
	} else {
		// número parcial → LIKE
		phoneCondition = { number: { [Op.like]: `%${onlyDigits}%` } };
	}

	return {
		[Op.or]: [
			{
			name: Sequelize.where(
				Sequelize.fn(
				"LOWER",
				Sequelize.fn("UNACCENT", Sequelize.col("Contact.name"))
				),
				{
				[Op.like]: Sequelize.literal(
					`'%' || UNACCENT('${normalizedSearchParam}') || '%'`
				)
				}
			)
			},
			phoneCondition
		],
		companyId: {
			[Op.eq]: companyId
		}
	};
}

const ListContactsService = async ({
  searchParam = "",
  pageNumber = "1",
  companyId
}: Request): Promise<Response> => {
  const normalizedSearchParam = searchParam.toLowerCase().trim();
  const whereCondition = buildWhereCondition(normalizedSearchParam,companyId);

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
