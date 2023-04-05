'use strict';

const _ = {
    get: require('lodash').get,
    isBoolean: require('lodash').isBoolean,
    isFloat: require('lodash-extends').isFloat,
    isPlainObject: require('lodash').isPlainObject,
    isUndefinedOrNull: require('lodash-extends').isUndefinedOrNull,
    map: require('lodash').map,
    set: require('lodash').set,
    toInteger: require('lodash').toInteger,
};

module.exports = (model, opts, cb) => {
    let pagination = (_.isBoolean(_.get(opts, 'pagination'))) ? _.get(opts, 'pagination') : true,
        paginate = (_.get(opts, 'paginate')) ? _.get(opts, 'paginate') : {},
        query,
        populate = _.get(opts, 'populate') || null,
        sort = _.get(opts, 'sort') || null,
        find = _.get(opts, 'find') || {},
        select = _.get(opts, 'select') || '';

    if (pagination) {
        // set default
        let page = _.toInteger(_.get(opts, 'paginate.page')),
            pageRange = _.get(opts, 'paginate.pageRange'),
            itemsPerPage = _.toInteger(_.get(opts, 'paginate.itemsPerPage')),
            startPage,
            endPage;

        page = (page && page > 0) ? page : 1;
        pageRange = (pageRange) ? pageRange.split('-') : null;
        itemsPerPage = (itemsPerPage && itemsPerPage > 0) ? itemsPerPage : 10;

        if (pageRange) {
            startPage = _.toInteger(pageRange[0]);
            endPage = _.toInteger(pageRange[1]);
        } else {
            startPage = page;
            endPage = page;
        }

        _.set(paginate, 'page', page);
        _.set(paginate, 'pageRange', pageRange);
        _.set(paginate, 'itemsPerPage', itemsPerPage);
        _.set(paginate, 'startPage', startPage);
        _.set(paginate, 'endPage', endPage);
    }

    query = model.find(find);
    query = query.select(select);
    if (!_.isUndefinedOrNull(sort)) query = query.sort(sort);
    if (!_.isUndefinedOrNull(populate)) query = query.populate(populate);
    query = query.lean();

    if (pagination) {
        model.count(find).exec((err, count) => {
            if (err) return cb(err);

            let pages,
                range,
                offset;

            pages = count / _.get(paginate, 'itemsPerPage');
            pages = _.isFloat(pages) ? _.toInteger(pages) + 1 : pages;
            range = (_.get(paginate, 'endPage') - _.get(paginate, 'startPage')) + 1;
            query = query.limit(_.get(paginate, 'itemsPerPage') * range);

            offset = _.get(paginate, 'itemsPerPage') * (_.get(paginate, 'startPage') - 1);
            offset = (offset > count) ? count : offset;

            query.skip(offset).exec((err, docs) => {
                let result = {};
                if (err) return cb(err);
                // defaul itemsToJson
                if (_.isBoolean(_.get(opts, 'itemsToJson')) && !_.get(opts, 'itemsToJson'))
                    _.set(result, 'items', docs);
                else _.set(result, 'items', model.toJson(docs));
                _.set(result, 'pagination.first', 1);
                _.set(result, 'pagination.items', _.get(result, 'items').length);
                _.set(result, 'pagination.last', pages);
                _.set(result, 'pagination.next', (_.get(paginate, 'endPage') >= pages) ? undefined : _.get(paginate, 'endPage') + 1);
                _.set(result, 'pagination.page', _.get(paginate, 'endPage'));
                _.set(result, 'pagination.pages', pages);
                _.set(result, 'pagination.previous', (_.get(paginate, 'endPage') == 1) ? undefined : _.get(paginate, 'endPage') - 1);
                _.set(result, 'pagination.offset', offset);
                _.set(result, 'pagination.totalItems', count);
                cb(null, result);
            });
        });
    } else {
        query.exec((err, docs) => {
            if (err) return cb(err);
            cb(null, {items: model.toJson(docs)});
        });
    }
};