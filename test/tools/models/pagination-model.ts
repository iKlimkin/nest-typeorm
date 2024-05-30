type SortOptions = {
  sortDirection: string;
  sortBy: string;
};

export class PaginationModel<T> {
  getData(
    data: PaginationModelData<T>,
    query?: any,
    hideFieldOptions?: any,
  ): PaginationModelData<T> {
    const { pagesCount, page, pageSize, totalCount, items } = data;

    let cItems = [...items];

    if (query?.searchEmailTerm || query?.searchLoginTerm) {
      cItems = this.filterQueryTerms(cItems, query);
    }

    if (query?.sortBy || query?.sortDirection) {
      cItems = this.sortingEntities(cItems, {
        sortBy: query.sortBy,
        sortDirection: query.sortDirection,
      });
    }

    if (query.hide === 'createdAt') {
      cItems = cItems.map((item) => ({
        ...item,
        createdAt: expect.any(String),
      }));
    }

    if (hideFieldOptions) {
      cItems = this.removeUnwantedFields(cItems, hideFieldOptions);
    }

    return {
      pagesCount: pagesCount ? pagesCount : 0,
      page: page ? page : 1,
      pageSize: pageSize ? pageSize : 10,
      totalCount: totalCount ? totalCount : 0,
      items: cItems ? cItems : [],
    };
  }

  private filterQueryTerms(data, query) {
    let result = [];
    if (query.searchEmailTerm || query.searchLoginTerm) {
      result = data.filter((e) => {
        const emailMatch = query.searchEmailTerm
          ? e.email.includes(query.searchEmailTerm)
          : !0;

        const loginMatch = query.searchLoginTerm
          ? e.login.includes(query.searchLoginTerm)
          : !0;

        return emailMatch || loginMatch;
      });
    }

    if (query.searchNameTerm) {
      result = data.filter((e) => e.name.includes(query.searchNameTerm));
    }

    return result;
  }

  private sortingEntities(data, sortOptions: SortOptions) {
    return data.sort((a, b) => {
      const fieldA = a[sortOptions.sortBy] || a['createdAt'];
      const fieldB = b[sortOptions.sortBy] || b['createdAt'];

      if (sortOptions.sortDirection === 'asc') {
        return fieldA.localeCompare(fieldB);
      }

      if (
        sortOptions.sortDirection === 'desc' ||
        sortOptions.sortDirection !== 'asc'
      ) {
        return fieldB.localeCompare(fieldA);
      }

      return 0;
    });
  }

  private removeUnwantedFields(data, fieldsToRemove) {
    return data.map((item) => {
      const newItem = { ...item };
      fieldsToRemove.forEach((field) => {
        delete newItem[field];
      });
      return newItem;
    });
  }
}

type PaginationModelData<T> = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: T[];
};

export const removeUnwantedFields = (data, fieldsToRemove) => {
  const items = data.items.map((item) => {
    const newItem = { ...item };
    fieldsToRemove.forEach((field) => {
      delete newItem[field];
    });
    return newItem;
  });
  return { ...data, items };
};
