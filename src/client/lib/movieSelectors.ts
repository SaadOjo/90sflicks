import type { ArchiveMovie, MovieCompanyCredit, MovieCredit, MoviePersonRole } from '../../shared/types/archive';

export function getCreditsByRole(movie: ArchiveMovie, roleType: MoviePersonRole): MovieCredit[] {
  return movie.credits
    .filter((credit) => credit.roleType === roleType)
    .sort((a, b) => (a.creditOrder ?? Number.MAX_SAFE_INTEGER) - (b.creditOrder ?? Number.MAX_SAFE_INTEGER));
}

export function getMainCast(movie: ArchiveMovie, limit = 4): MovieCredit[] {
  return getCreditsByRole(movie, 'cast').slice(0, limit);
}

export function getCompaniesByRole(movie: ArchiveMovie, roleType: MovieCompanyCredit['roleType']): MovieCompanyCredit[] {
  return movie.companies.filter((company) => company.roleType === roleType);
}
