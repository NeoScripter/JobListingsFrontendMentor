const API_URL = 'http://api-endpoint.ru.swtest.ru/api/job-listings';
const SESSION_KEY = 'jobs';
const STORAGE_DURATION = 2000;

class JobBoard {
    constructor() {
        this.container = document.querySelector('.cards');
        this.filterList = document.querySelector('.filter-list');
        this.cardTemplate = document.querySelector('#card__template');
        this.btnTemplate = document.querySelector('#btn__template');
        this.clearBtn = document.querySelector('#clear-btn');
        this.filters = document.querySelector('#filters');
        this.appliedFilters = new Set();
    }

    async init() {
        this.setClickEvents();
        await this.loadJobs();
    }

    async loadJobs() {
        try {
            if (this.checkCache(SESSION_KEY)) {
                const jobs = sessionStorage.getItem(SESSION_KEY);
                this.renderJobs(JSON.parse(jobs).jobs);
                return;
            }

            this.updateLoadingState('Loading...');
            const res = await fetch(API_URL);
            if (!res.ok) throw new Error(`Failed to fetch jobs: ${res.status}`);

            const jobs = await res.json();
            this.renderJobs(jobs);
            this.storeCache(jobs);
        } catch (err) {
            console.error(err.message);
            this.updateLoadingState('An error occured');
        }
    }

    setClickEvents() {
        this.container.addEventListener('click', (event) => {
            if (event.target.className === 'card__tag') {
                this.addFilter(event.target.textContent);
            }
        });
        this.filterList.addEventListener('click', (event) => {
            const btn = event.target.closest('.btn-remove-filter');
            if (!btn) return;

            const text = btn.closest('li').querySelector('span').textContent;
            this.removeFilter(text);
        });

        this.clearBtn.addEventListener('click', () => this.clearFilters());
    }

    clearFilters() {
        this.appliedFilters.clear();
        this.filters.classList.add('hidden');
    }

    addFilter(filter) {
        this.appliedFilters.add(filter);

        this.renderBtns(this.appliedFilters);

        this.filters.classList.remove('hidden');
    }

    removeFilter(filter) {
        this.appliedFilters.delete(filter);

        if (this.appliedFilters.size === 0) {
            this.filters.classList.add('hidden');
            return;
        }

        this.renderBtns(this.appliedFilters);

        this.filters.classList.remove('hidden');
    }

    storeCache(jobs) {
        let data = {
            jobs,
            timestamp: +new Date(),
        };

        data = JSON.stringify(data);
        sessionStorage.setItem(SESSION_KEY, data);
    }

    checkCache(key, duration = STORAGE_DURATION) {
        let stored = sessionStorage.getItem(key);

        if (stored != null) {
            stored = JSON.parse(stored);
            if (Math.abs(stored.timestamp - Number(new Date())) >= duration) {
                sessionStorage.removeItem(key);
                return false;
            }
            return true;
        }

        return false;
    }

    updateLoadingState(message) {
        this.container.innerHTML = '';
        this.container.innerHTML = `<p>${message}</p>`;
    }

    renderJobs(jobs) {
        const fragment = document.createDocumentFragment();
        jobs.forEach((job) => this.addJobCard(job, fragment));
        this.container.innerHTML = '';
        this.container.appendChild(fragment);
    }

    renderBtns(btns) {
        const fragment = document.createDocumentFragment();
        btns.forEach((btn) => this.addFilterBtn(btn, fragment));
        this.filterList.innerHTML = '';
        this.filterList.appendChild(fragment);
    }

    addFilterBtn(text, fragment) {
        const button = this.btnTemplate.content.cloneNode(true);
        button.querySelector('span').innerText = text;
        fragment.appendChild(button);
    }

    addJobCard(job, fragment) {
        const card = this.cardTemplate.content.cloneNode(true);

        card.querySelector('img').src = job.logo_url;
        card.querySelector('.card__company').textContent = job.company_name;
        card.querySelector('.card__title').textContent = job.title;

        const meta = card.querySelector('.card__data');
        meta.innerHTML = '';

        [job.employment_type, job.location_type, job.created_at_human].forEach(
            (text) => {
                const li = document.createElement('li');
                li.textContent = text;
                meta.appendChild(li);
            }
        );

        const tags = card.querySelector('.card__tags');
        tags.innerHTML = '';

        job.tag_names.forEach((tagName) => {
            const li = document.createElement('li');
            const tag = document.createElement('button');
            tag.classList.add('card__tag');
            tag.innerText = tagName;
            li.appendChild(tag);
            tags.appendChild(li);
        });

        fragment.appendChild(card);
    }
}

new JobBoard().init();
