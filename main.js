function createAuthorElement(record) {
    let user = record.user || { 'name': { 'first': '', 'last': '' } };
    let authorElement = document.createElement('div');
    authorElement.classList.add('author-name');
    authorElement.innerHTML = user.name.first + ' ' + user.name.last;
    return authorElement;
}

function createUpvotesElement(record) {
    let upvotesElement = document.createElement('div');
    upvotesElement.classList.add('upvotes');
    upvotesElement.innerHTML = record.upvotes;
    return upvotesElement;
}

function createFooterElement(record) {
    let footerElement = document.createElement('div');
    footerElement.classList.add('item-footer');
    footerElement.append(createAuthorElement(record));
    footerElement.append(createUpvotesElement(record));
    return footerElement;
}

function createContentElement(record) {
    let contentElement = document.createElement('div');
    contentElement.classList.add('item-content');
    contentElement.innerHTML = record.text;
    return contentElement;
}

function createListItemElement(record) {
    let itemElement = document.createElement('div');
    itemElement.classList.add('facts-list-item');
    itemElement.append(createContentElement(record));
    itemElement.append(createFooterElement(record));
    return itemElement;
}

function renderRecords(records) {
    let factsList = document.querySelector('.facts-list');
    factsList.innerHTML = '';
    for (let i = 0; i < records.length; i++) {
        factsList.append(createListItemElement(records[i]));
    }
}

function setPaginationInfo(info) {
    document.querySelector('.total-count').innerHTML = info.total_count;
    let start = info.total_count && (info.current_page - 1) * info.per_page + 1;
    document.querySelector('.current-interval-start').innerHTML = start;
    let end = Math.min(info.total_count, start + info.per_page - 1);
    document.querySelector('.current-interval-end').innerHTML = end;
}

function createPageBtn(page, classes = []) {
    let btn = document.createElement('button');
    classes.push('btn');
    for (cls of classes) {
        btn.classList.add(cls);
    }
    btn.dataset.page = page;
    btn.innerHTML = page;
    return btn;
}

const searchField = document.querySelector('.search-field')
const searchBtn = document.querySelector('.search-btn')
let term = ''

async function autocomplete() {
    if (term === searchField.value) {
        return
    }
    const searchOptions = document.querySelectorAll('.search-option')
    searchOptions.forEach(option => option.remove())
    if (searchField.value !== '') {
        let res = await fetch(`http://cat-facts-api.std-900.ist.mospolytech.ru/autocomplete?q=${searchField.value}`)
        res = await res.json()
        const searchForm = document.querySelector('.search-form')
        for (let item of res.slice(0, 5)) {
            paragraph = document.createElement("p")
            paragraph.innerHTML = item
            paragraph.classList.add("search-option")
            paragraph.addEventListener('click', () => {
                searchField.value = item
                const searchOptions = document.querySelectorAll('.search-option')
                searchOptions.forEach(option => option.remove())
            })
            searchForm.appendChild(paragraph)
        }
        term = searchField.value
    }
}

async function search(page = 1) {
    let searchTerm = window.localStorage.getItem('search')
    if (searchField.value !== '') {
        let perPage = document.querySelector('.per-page-btn').value;
        window.localStorage.setItem('search', searchField.value)
        let url = new URL('http://cat-facts-api.std-900.ist.mospolytech.ru/facts')
        url.searchParams.append('page', page);
        url.searchParams.append('per-page', perPage);
        url.searchParams.append('q', searchTerm ? searchTerm : searchField.value);
        let res = await fetch(url)
        res = await res.json()
        renderRecords(res.records);
        setPaginationInfo(res['_pagination']);
        renderPaginationElement(res['_pagination']);
    } else {
        window.localStorage.removeItem('search')
        downloadData()
    }
}

setInterval(autocomplete, 500)
searchBtn.addEventListener('click', search)

function renderPaginationElement(info) {
    let btn;
    let paginationContainer = document.querySelector('.pagination');
    paginationContainer.innerHTML = '';

    btn = createPageBtn(1, ['first-page-btn']);
    btn.innerHTML = 'Первая страница';
    if (info.current_page == 1) {
        btn.style.visibility = 'hidden';
    }
    paginationContainer.append(btn);

    let buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('pages-btns');
    paginationContainer.append(buttonsContainer);

    let start = Math.max(info.current_page - 2, 1);
    let end = Math.min(info.current_page + 2, info.total_pages);
    for (let i = start; i <= end; i++) {
        btn = createPageBtn(i, i == info.current_page ? ['active'] : []);
        buttonsContainer.append(btn);
    }

    btn = createPageBtn(info.total_pages, ['last-page-btn']);
    btn.innerHTML = 'Последняя страница';
    if (info.current_page == info.total_pages) {
        btn.style.visibility = 'hidden';
    }
    paginationContainer.append(btn);
}

function downloadData(page = 1) {
    let factsList = document.querySelector('.facts-list');
    let url = new URL(factsList.dataset.url);
    let perPage = document.querySelector('.per-page-btn').value;
    url.searchParams.append('page', page);
    url.searchParams.append('per-page', perPage);
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'json';
    xhr.onload = function () {
        if (window.localStorage.getItem('search')) {
            console.log(111)
            search(page)
        } else {
            renderRecords(this.response.records);
            setPaginationInfo(this.response['_pagination']);
            renderPaginationElement(this.response['_pagination']);
        }
    };
    xhr.send();
}

function perPageBtnHandler(event) {
    downloadData(1);
}

function pageBtnHandler(event) {
    if (event.target.dataset.page) {
        downloadData(event.target.dataset.page);
        window.scrollTo(0, 0);
    }
}

window.onload = function () {
    downloadData();
    document.querySelector('.pagination').onclick = pageBtnHandler;
    document.querySelector('.per-page-btn').onchange = perPageBtnHandler;
};