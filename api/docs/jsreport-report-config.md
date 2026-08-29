# jsreport `report_config` contract

The document template settings edited in **ការកំណត់ → របាយការណ៍ → ទម្រង់ឯកសារ** are stored in
`organization.organization_report_config` and sent to jsreport on every report render.

The handlebars templates themselves live on the jsreport server (`JS_BASE_URL`), not in this
repo — this file is the contract between the two.

## How it arrives

`JsReportService.getAxiosConfig()` merges the config at the **top level** of the posted `data`:

```ts
data: reportConfig ? { ...data, report_config: reportConfig } : data
```

This is deliberate. Call sites disagree on the envelope — some pass `body` bare
(`plan-activity.service.ts`, `project-info.service.ts`), others wrap it as `{ data: body }`
(`member.service.ts`, `team.service.ts`, `plan-task.service.ts`, `comparation.service.ts`) —
which is why templates carry fallbacks like:

```hbs
{{#if organization.logo}}…{{else}}{{#if data.organization.logo}}…{{/if}}{{/if}}
```

Merging at the top level means `report_config` is always at `{{report_config.*}}`, whichever
envelope the caller used. **No fallback needed for these fields.**

## Payload shape

Produced by `ReportConfigProvider.forOrganization()` in
`src/app/shared/report/report-config.provider.ts`:

| Field | Type | Notes |
|---|---|---|
| `show_kingdom` | boolean | ព្រះរាជាណាចក្រកម្ពុជា block |
| `kingdom_align_right` | boolean | **Precomputed** — see below |
| `show_logo` | boolean | |
| `logo` | `{ file_domain, uri }` \| null | Report-specific logo; null means none set |
| `show_organization` | boolean | |
| `organization_align_left` / `organization_align_right` | boolean | **Precomputed**, same pattern as `kingdom_align_right`. Both false means center |
| `organization_lines` | `{ text, moul, bold }[]` | Each line has its own Moul/Bold flags, set per line in the "Add/Edit Organization" dialog. Defaults to `[{ text: org.name_kh, moul: true, bold: false }]` when never saved |
| `show_number` | boolean | លេខ |
| `show_page_number` | boolean | លេខទំព័រ |
| `show_print_date` | boolean | កាលបរិច្ឆេទបោះពុម្ព |
| `printed_on` | string | `dd/mm/yyyy` |
| `footer_text` | string | Editable footer label; defaults to the system name when never saved |
| `footer_align_left` / `footer_align_right` | boolean | **Precomputed**, same pattern as `organization_align_left/_right`. Both false means center |

Several fields are precomputed on purpose: jsreport ships **Handlebars 4.7, which has no `eq`
helper and no date formatting**. Sending `kingdom_align: "right"` or `organization_align: "left"`
would force `{{#if (eq …)}}` and a registered helper on the jsreport side; booleans need neither.
`organization_align` has three states, so it arrives as two booleans (`_left` / `_right`) nested
the same way the snippet below nests them — both false means center. Same reasoning for
`printed_on`.

An organization that has never opened the dialog has no row — the provider returns the same
defaults the dialog shows, so templates never see `undefined`.

## Header snippet

Drop-in replacement for the existing header block. Keeps the 3-column grid, the
`moul-regular` class and the `{{asset}}` divider; the kingdom block moves between column 2
and column 3 rather than duplicating markup.

```hbs
<div class="grid grid-cols-3 items-start mt-[10px]">

    <!-- Left: logo + organization name lines -->
    <div class="flex flex-col mt-8">

        {{#if report_config.show_logo}}
            <div class="flex justify-center">
                {{#if report_config.logo}}
                    <img class="w-[90px]"
                         src="{{report_config.logo.file_domain}}/{{report_config.logo.uri}}" />
                {{else}}
                    {{! No report logo set — fall back to the organization logo. }}
                    {{#if organization.logo}}
                        <img class="w-[90px]"
                             src="{{organization.logo.file_domain}}/{{organization.logo.uri}}" />
                    {{else}}
                        {{#if data.organization.logo}}
                            <img class="w-[90px]"
                                 src="{{data.organization.logo.file_domain}}/{{data.organization.logo.uri}}" />
                        {{/if}}
                    {{/if}}
                {{/if}}
            </div>
        {{/if}}

        {{#if report_config.show_organization}}
            {{#each report_config.organization_lines}}
                <div class="text-[13px] mt-2 {{#if ../report_config.organization_align_left}}text-left{{else}}{{#if ../report_config.organization_align_right}}text-right{{else}}text-center{{/if}}{{/if}} {{#if this.moul}}moul-regular{{/if}} {{#if this.bold}}font-bold{{/if}}">{{this.text}}</div>
            {{/each}}
        {{/if}}

        {{#if report_config.show_number}}
            <div class="{{#if report_config.organization_align_left}}text-left{{else}}{{#if report_config.organization_align_right}}text-right{{else}}text-center{{/if}}{{/if}} text-[12px] mt-2">លេខ ..........</div>
        {{/if}}

    </div>

    {{#if report_config.show_kingdom}}
        <div class="flex flex-col moul-regular text-[16px] {{#if report_config.kingdom_align_right}}col-start-3 items-end{{else}}col-start-2 items-center{{/if}}">
            <h1>ព្រះរាជាណាចក្រកម្ពុជា</h1>
            <h1>ជាតិ សាសនា ព្រះមហាក្សត្រ</h1>
            <img class="w-[150px] mt-1"
                 src="{{asset "/PMS/assets/images/tacteing33-removebg-preview.png" "dataURI"}}" />
        </div>
    {{/if}}

</div>
```

## Footer — in-body vs per-page

`footer_text` is the editable label on the left of the footer row (defaults to the system
name when the organization has never customized it). Like `organization_align`, its alignment
arrives precomputed as `footer_align_left` / `footer_align_right` — both false means center.
Works as plain handlebars anywhere in the body flow:

```hbs
<div class="text-[11px] {{#if report_config.footer_align_left}}text-left{{else}}{{#if report_config.footer_align_right}}text-right{{else}}text-center{{/if}}{{/if}}">{{report_config.footer_text}}</div>
```

`show_print_date` works as plain handlebars anywhere in the body flow:

```hbs
{{#if report_config.show_print_date}}
    <div class="text-right text-[11px]">បោះពុម្ពនៅ {{report_config.printed_on}}</div>
{{/if}}
```

`show_page_number` **cannot** — a body-flow div renders once, not per page. True per-page
numbering with the `chrome-pdf` recipe needs Chrome's own footer, which is rendered outside
the Handlebars pass:

```ts
template: {
    name: templateName,
    chrome: {
        displayHeaderFooter: true,
        footerTemplate: '<div style="font-size:9px; width:100%; text-align:center;">' +
                        '<span class="pageNumber"></span> / <span class="totalPages"></span></div>',
        marginBottom: '1.5cm',
    },
}
```

**Not implemented yet.** It needs `getAxiosConfig()` extended to merge per-request `chrome`
overrides, and two gotchas verified first:

1. Chrome's footer defaults to roughly 6pt — always set an explicit `font-size`.
2. The footer template does **not** inherit the document `<head>`, so there is no Google
   Fonts link. Khmer text such as `កាលបរិច្ឆេទបោះពុម្ព` will likely render as tofu boxes
   unless the font is inlined as base64 or the footer is kept numeric.

## Where it is wired

| Service | Template |
|---|---|
| `member.service.ts` | `organization_member` |
| `team.service.ts` | `project_member` |
| `plan-task.service.ts` | `project_task` |
| `plan-activity.service.ts` (×2) | `project_activity_listing` |
| `comparation.service.ts` | `project_comparation` |

Not wired: `users.service.ts` (`sup_admin_user`) — a super-admin listing that spans
organizations, so there is no single config to apply.
