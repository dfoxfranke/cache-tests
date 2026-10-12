import * as templates from './lib/templates.mjs'
import * as utils from './lib/utils.mjs'

export default

{
  name: 'Other Caching Requirements',
  id: 'other',
  description: 'These tests check miscellaneous HTTP cache behaviours. ',
  tests: [
    {
      name: 'HTTP cache must generate an `Age` header field when using a stored response.',
      id: 'other-age-gen',
      depends_on: ['freshness-max-age'],
      spec_anchors: ['field.age', 'constructing.responses.from.caches'],
      requests: [
        templates.fresh({}),
        {
          expected_type: 'cached',
          expected_response_headers: [
            ['Age', '>', 2]
          ]
        }
      ]
    },
    {
      name: 'Does HTTP cache insert an `Age` header field when there is delay generating the response?',
      id: 'other-age-delay',
      kind: 'check',
      requests: [
        {
          response_headers: [
            ['Cache-Control', 'max-age=3600'],
            ['Date', 0]
          ],
          response_pause: 5,
          expected_response_headers: [['age', '>', 0]]
        }
      ]
    },
    {
      name: 'HTTP cache must update the `Age` header field when freshness is based upon `Expires`',
      id: 'other-age-update-expires',
      depends_on: ['freshness-expires-future'],
      spec_anchors: ['constructing.responses.from.caches', 'field.age'],
      requests: [
        {
          response_headers: [
            ['Expires', 30 * 24 * 60 * 60],
            ['Date', 0],
            ['Age', '30']
          ],
          pause_after: true,
          setup: true
        },
        {
          expected_type: 'cached',
          expected_response_headers: [
            ['Age', '>', 32]
          ]
        }
      ]
    },
    {
      name: 'HTTP cache must update the `Age` header field when freshness is based upon `CC: max-age`',
      id: 'other-age-update-max-age',
      depends_on: ['freshness-max-age'],
      spec_anchors: ['constructing.responses.from.caches', 'field.age'],
      requests: [
        templates.fresh({
          response_headers: [
            ['Age', '30']
          ]
        }),
        {
          expected_type: 'cached',
          expected_response_headers: [
            ['Age', '>', 32]
          ]
        }
      ]
    },
    {
      name: 'HTTP cache must not update the `Date` header field',
      id: 'other-date-update',
      depends_on: ['freshness-max-age'],
      spec_anchors: ['field.date'],
      requests: [
        templates.fresh({}),
        {
          expected_type: 'cached',
          expected_response_headers: [
            ['Date', 0]
          ]
        }
      ]
    },
    {
      name: 'HTTP cache must not update the `Date` header field when `Expires` is present',
      id: 'other-date-update-expires',
      depends_on: ['freshness-expires-future'],
      spec_anchors: ['field.date'],
      requests: [
        {
          response_headers: [
            ['Expires', 30 * 24 * 60 * 60],
            ['Date', 0]
          ],
          pause_after: true,
          setup: true
        },
        {
          expected_type: 'cached',
          expected_response_headers: [
            ['Date', 0]
          ]
        }
      ]
    },
    {
      name: 'Does HTTP cache leave the `Expires` header field alone?',
      id: 'other-date-update-expires-update',
      kind: 'check',
      depends_on: ['freshness-expires-future'],
      spec_anchors: ['field.date'],
      requests: [
        {
          response_headers: [
            ['Expires', 30 * 24 * 60 * 60],
            ['Date', 0]
          ],
          pause_after: true,
          setup: true
        },
        {
          expected_type: 'cached',
          expected_response_headers: [
            ['Expires', 30 * 24 * 60 * 60]
          ]
        }
      ]
    },
    {
      name: 'Different query arguments must be different cache keys',
      id: 'query-args-different',
      spec_anchors: ['caching.overview'],
      depends_on: ['freshness-max-age'],
      requests: [
        templates.fresh({
          query_arg: 'test=' + utils.httpContent('query-args-different-1')
        }),
        {
          query_arg: 'test=' + utils.httpContent('query-args-different-2'),
          expected_type: 'not_cached'
        }
      ]
    },
    {
      name: 'An optimal HTTP cache should not be affected by the presence of a URL query',
      id: 'query-args-same',
      kind: 'optimal',
      depends_on: ['freshness-max-age'],
      requests: [
        templates.fresh({
          query_arg: 'test=' + utils.httpContent('query-args-same')
        }),
        {
          query_arg: 'test=' + utils.httpContent('query-args-same'),
          expected_type: 'cached'
        }
      ]
    },
    {
      name: 'Does HTTP heuristically cache a response with a `Content-Disposition: attachment` header?',
      id: 'other-heuristic-content-disposition-attachment',
      kind: 'check',
      depends_on: ['heuristic-200-cached'],
      requests: [
        {
          response_headers: [
            ['Last-Modified', -100000],
            ['Date', 0],
            ['Content-Disposition', 'attachment; filename=example.txt']
          ],
          setup: true
        },
        {
          expected_type: 'cached'
        }
      ]
    },
    {
      name: 'Does HTTP reuse a fresh response with a `Content-Disposition: attachment` header?',
      id: 'other-fresh-content-disposition-attachment',
      kind: 'check',
      depends_on: ['freshness-max-age'],
      requests: [
        templates.fresh({
          response_headers: [
            ['Content-Disposition', 'attachment; filename=example.txt']
          ]
        }),
        {
          expected_type: 'cached'
        }
      ]
    },
    {
      name: 'An optimal HTTP cache reuses a fresh response with a `Set-Cookie` header',
      id: 'other-set-cookie',
      depends_on: ['freshness-max-age'],
      kind: 'optimal',
      requests: [
        templates.fresh({
          response_headers: [
            ['Set-Cookie', 'a=b']
          ]
        }),
        {
          expected_type: 'cached'
        }
      ]
    },
    {
      name: 'An optimal HTTP cache reuses a fresh response when the request has a `Cookie` header',
      id: 'other-cookie',
      kind: 'optimal',
      depends_on: ['freshness-max-age'],
      requests: [
        templates.fresh({}),
        {
          request_headers: [
            ['Cookie', 'a=b']
          ],
          expected_type: 'cached'
        }
      ]
    },
    {
      name: 'Does the HTTP cache update a Content-Language header on a weak ETag match?',
      id: 'other-content-language-update-weak-etag',
      kind: 'check',
      requests: [
        templates.becomeStale({
          request_headers: [
            ['Accept-Language', 'fr']
          ],
          response_headers: [
            ['Content-Language', 'en'],
            ['Vary', 'Accept-Language'],
            ['ETag', 'W/"v1"'],
          ]
        }),
        templates.fresh({
          request_headers: [
            ['Accept-Language', 'fr'],
            ['If-None-Match', 'W/"v1"']
          ],
          response_headers: [
            ['Content-Language', 'fr', false],
            ['Vary', 'Accept-Language'],
            ['ETag', 'W/"v1"'],
          ],
          expected_type: 'etag_validated',
          expected_status: 304
        }),
        {
          request_headers: [
            ['Accept-Language', 'fr']
          ],
          expected_type: 'cached',
          setup_tests: ['expected_type'],
          expected_response_headers: [
            ['Content-Language', 'fr']
          ]
        }
      ]
    },
    {
      name: 'Does the HTTP cache update a Content-Language header on a strong ETag match?',
      id: 'other-content-language-update-strong-etag',
      kind: 'check',
      requests: [
        templates.becomeStale({
          request_headers: [
            ['Accept-Language', 'fr']
          ],
          response_headers: [
            ['Content-Language', 'en'],
            ['Vary', 'Accept-Language'],
            ['ETag', '"v1"'],
          ]
        }),
        templates.fresh({
          request_headers: [
            ['Accept-Language', 'fr'],
            ['If-None-Match', '"v1"']
          ],
          response_headers: [
            ['Content-Language', 'fr', false],
            ['Vary', 'Accept-Language'],
            ['ETag', '"v1"'],
          ],
          expected_type: 'etag_validated',
          expected_status: 304,
        }),
        {
          request_headers: [
            ['Accept-Language', 'fr']
          ],
          expected_type: 'cached',
          setup_tests: ['expected_type'],
          expected_response_headers: [
            ['Content-Language', 'fr']
          ]
        }
      ]
    },
    {
      name: 'Does the HTTP cache update a Content-Language header on a weak Last-Modified match?',
      id: 'other-content-language-update-weak-lm',
      kind: 'check',
      requests: [
        templates.becomeStale({
          request_headers: [
            ['Accept-Language', 'fr']
          ],
          response_headers: [
            ['Content-Language', 'en'],
            ['Vary', 'Accept-Language'],
            ['Date', 0],
            ['Last-Modified', 0]
          ]
        }),
        templates.fresh({
          request_headers: [
            ['Accept-Language', 'fr'],
            ['If-Modified-Since', 0]
          ],
          response_headers: [
            ['Content-Language', 'fr', false],
            ['Vary', 'Accept-Language'],
          ],
          expected_type: 'lm_validated',
          expected_status: 304,
          magic_ims: true
        }),
        {
          request_headers: [
            ['Accept-Language', 'fr']
          ],
          expected_type: 'cached',
          setup_tests: ['expected_type'],
          expected_response_headers: [
            ['Content-Language', 'fr']
          ]
        }
      ]
    },
    {
      name: 'Does the HTTP cache update a Content-Language header on a strong Last-Modified match?',
      id: 'other-content-language-update-strong-lm',
      kind: 'check',
      requests: [
        templates.becomeStale({
          request_headers: [
            ['Accept-Language', 'fr']
          ],
          response_headers: [
            ['Content-Language', 'en'],
            ['Vary', 'Accept-Language'],
            ['Date', 0],
            ['Last-Modified', -100000]
          ]
        }),
        templates.fresh({
          request_headers: [
            ['Accept-Language', 'fr'],
            ['If-Modified-Since', 0]
          ],
          response_headers: [
            ['Content-Language', 'fr', false],
            ['Vary', 'Accept-Language'],
          ],
          expected_type: 'lm_validated',
          expected_status: 304,
          magic_ims: true
        }),
        {
          request_headers: [
            ['Accept-Language', 'fr']
          ],
          expected_type: 'cached',
          setup_tests: ['expected_type'],
          expected_response_headers: [
            ['Content-Language', 'fr']
          ]
        }
      ]
    },
    {
      name: 'Does the HTTP cache update a Vary header on a match-breaking weak ETag match?',
      id: 'other-vary-update-weak-etag',
      kind: 'check',
      requests: [
        templates.becomeStale({
          request_headers: [
            ['Foo', 'foo'],
            ['Bar', '0']
          ],
          response_headers: [
            ['Vary', 'Foo'],
            ['ETag', 'W/"v1"'],
          ]
        }),
        templates.fresh({
          request_headers: [
            ['Foo', 'foo'],
            ['Bar', '1'],
            ['If-None-Match', 'W/"v1"']
          ],
          response_headers: [
            ['Vary', 'Bar'],
            ['ETag', 'W/"v1"'],
          ],
          expected_type: 'etag_validated',
          expected_status: 304
        }),
        {
          request_headers: [
            ['Foo', 'foo'],
            ['Bar', '1'],
          ],
          expected_type: 'cached',
          expected_reponse_headers: ['Vary', 'Bar']
        }
      ]
    },
    {
      name: 'Does the HTTP cache update a Vary header on a match-breaking strong ETag match?',
      id: 'other-vary-update-strong-etag',
      kind: 'check',
      requests: [
        templates.becomeStale({
          request_headers: [
            ['Foo', 'foo'],
            ['Bar', '0']
          ],
          response_headers: [
            ['Vary', 'Foo'],
            ['ETag', '"v1"'],
          ]
        }),
        templates.fresh({
          request_headers: [
            ['Foo', 'foo'],
            ['Bar', '1'],
            ['If-None-Match', '"v1"']
          ],
          response_headers: [
            ['Vary', 'Bar'],
            ['ETag', '"v1"'],
          ],
          expected_type: 'etag_validated',
          expected_status: 304
        }),
        {
          request_headers: [
            ['Foo', 'foo'],
            ['Bar', '1'],
          ],
          expected_type: 'cached',
          expected_reponse_headers: ['Vary', 'Bar']
        }
      ]
    },
    {
      name: 'Does the HTTP cache update a Vary header on a match-breaking weak Last-Modified match?',
      id: 'other-vary-update-weak-lm',
      kind: 'check',
      requests: [
        templates.becomeStale({
          request_headers: [
            ['Foo', 'foo'],
            ['Bar', '0']
          ],
          response_headers: [
            ['Vary', 'Foo'],
            ['Date', 0],
            ['Last-Modified', 0]
          ]
        }),
        templates.fresh({
          request_headers: [
            ['Foo', 'foo'],
            ['Bar', '1'],
            ['If-Modified-Since', 0]
          ],
          response_headers: [
            ['Vary', 'Bar'],
          ],
          expected_type: 'lm_validated',
          expected_status: 304,
          magic_ims: true
        }),
        {
          request_headers: [
            ['Foo', 'foo'],
            ['Bar', '1'],
          ],
          expected_type: 'cached',
          expected_reponse_headers: ['Vary', 'Bar']
        }
      ]
    },
    {
      name: 'Does the HTTP cache update a Vary header on a match-breaking strong Last-Modified match?',
      id: 'other-vary-update-strong-lm',
      kind: 'check',
      requests: [
        templates.becomeStale({
          request_headers: [
            ['Foo', 'foo'],
            ['Bar', '0']
          ],
          response_headers: [
            ['Vary', 'Foo'],
            ['Date', 0],
            ['Last-Modified', -1000000]
          ]
        }),
        templates.fresh({
          request_headers: [
            ['Foo', 'foo'],
            ['Bar', '1'],
            ['If-Modified-Since', 0]
          ],
          response_headers: [
            ['Vary', 'Bar'],
          ],
          expected_type: 'lm_validated',
          expected_status: 304,
          magic_ims: true
        }),
        {
          request_headers: [
            ['Foo', 'foo'],
            ['Bar', '1'],
          ],
          expected_type: 'cached',
          expected_reponse_headers: ['Vary', 'Bar']
        }
      ]
    }
  ]
}
