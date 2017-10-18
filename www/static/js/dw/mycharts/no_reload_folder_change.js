define(function(require) {
    var $ = require('jquery'),
        twig = require('./twig_globals'),
        multiselection = require('./multiselection'),
        generic_chart_functions = require('./generic-chart-functions'),
        buildLink = require('./buildLink'),
        drag_n_drop_callback = false,
        cft;

    function link_reader(link) {
        var parsed = link.slice(1).split('/'),
            id = {
                org: false,
                folder: false
            };

        if (parsed[0] == 'mycharts')
            id.folder = (parsed.length > 1) ? parsed[1] : false;
        else {
            id.org = parsed[1];
            id.folder = (parsed.length > 2) ? parsed[2] : false;
        }

        return id;
    }

    function build_thumbnail(folder, org_id) {
        var li = document.createElement('li'),
            a = document.createElement('a'),
            i = document.createElement('i'),
            span = document.createElement('span');

        li.classList.add('span2');
        li.setAttribute('folder-id', folder.id);
        a.classList.add('thumbnail');
        a.setAttribute('href', (org_id) ? '/team/' + org_id + '/' + folder.id : '/mycharts/' + folder.id);
        i.classList.add('im');
        i.classList.add('im-folder');
        i.classList.add('im-fw');
        span.innerText = ' ' + folder.name;
        a.appendChild(i);
        a.appendChild(span);
        li.appendChild(a);
        return li;
    }

    function repaint_subfolders() {
        var id = cft.getCurrentFolder();

        $('ul.subfolders li.span2').not('.add-button').remove();
        subfolders = $('ul.subfolders');

        if (id.folder) {
            cft.getSubFolders(id.folder).forEach(function(folder) {
                subfolders.prepend(build_thumbnail(folder, id.organization));
            });
        } else {
            cft.getRootSubFolders(id.organization).forEach(function(folder) {
                subfolders.prepend(build_thumbnail(folder, id.organization));
            });
        }
        set_click('ul.subfolders a:not(.add-folder)');
    }

    function repaint_breadcrumb() {
        var id = cft.getCurrentFolder(),
            line = $('#folder-sequence'),
            sep = '<span class="sep">›</span>',
            cur_org_name = cft.getOrgNameById(id.organization);

        line.empty();
        $('#current-folder-name').empty();
        $('#current-root').attr('href', (id.organization) ? '/team/' + id.organization : twig.globals.strings.mycharts_base);
        $('#current-root').text((cur_org_name) ? cur_org_name : twig.globals.strings.mycharts_trans);

        if (!id.folder) return;
        cft.getIdsToFolder(id.folder).forEach(function(id) {
            var a = document.createElement('a'),
                folder = cft.getFolderById(id);

            a.innerText = dw.utils.purifyHtml(folder.name, '');
            a.setAttribute('href', (folder.organization) ? '/team/' + folder.organization + '/' + folder.id : twig.globals.strings.mycharts_base + '/' + folder.id);
            line.append(sep, a);
        });
        line.append(sep);
        $('#current-folder-name').html(dw.utils.purifyHtml(cft.getFolderNameById(id.folder), ''));
        set_click('#folder-sequence a');
    }

    function reloadLink(path) {
        // normalize path
        var url = 'https://'+location.host + location.pathname + location.search,
            params = new URL(url).searchParams,
            sort = cft.getCurrentSort(),
            pag_str = false,
            path_pag_sort;

        if (path.startsWith('?page')) {
            // click on pagination
            pag_str = path;
            cft.setCurrentPage(params.get('path'));
            path = buildLink(cft.getCurrentFolder());
        }
        if (pag_str && sort) {
            path_pag_sort = path + pag_str + '&sort='+ sort + '&xhr=1';
        } else if (pag_str) {
            path_pag_sort = path + pag_str + '&xhr=1';
        } else if (sort) {
            path_pag_sort = path + '?sort=' + sort + '&xhr=1';
        } else {
            path_pag_sort = path + '?xhr=1';
        }

        var chart_list = $('.mycharts-chart-list')
            .addClass('reloading')
            .load(path_pag_sort, function() {
                var id = link_reader(path);

                cft.setCurrentFolder(id.folder, id.org);
                window.history.pushState(null, '', path_pag_sort.slice(0, path_pag_sort.lastIndexOf('xhr=1') - 1));

                repaint_subfolders();
                repaint_breadcrumb();
                set_click('div.pagination li a');
                set_click('.mycharts-chart-list h3 a');

                multiselection.init();
                generic_chart_functions();
                cft.updateCurrentFolderFuncs();
                if (drag_n_drop_callback) drag_n_drop_callback();
                chart_list.removeClass('reloading');
            });
    }

    function set_click(selector) {
        $(selector)
            .on('click', function(evt) {
                var path = $(evt.currentTarget).attr('href');
                evt.preventDefault();
                reloadLink(path);
            });
    }

    function init() {
        cft = window['ChartFolderTree'];
        set_click('#current-root');
        set_click('ul.folders-left li a');
        set_click('#folder-sequence a');
        set_click('ul.subfolders a:not(.add-folder)');
        set_click('div.pagination li a');
    }

    function reenableClicks() {
        set_click('ul.folders-left li:not(.root-folder) a');
        set_click('#folder-sequence a');
        set_click('ul.subfolders a:not(.add-folder)');
        set_click('div.pagination li a');
    }

    function setDragNDropCallback(func) {
        drag_n_drop_callback = func;
    }

    return {
        init: init,
        enable_for_selector: set_click,
        reloadLink: reloadLink,
        reenableClicks: reenableClicks,
        setDragNDropCallback: setDragNDropCallback,
        repaintBreadcrumb: repaint_breadcrumb,
        repaintSubfolders: repaint_subfolders
    };
});
