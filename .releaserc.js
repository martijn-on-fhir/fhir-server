module.exports = {
    branches: [
        'master',
        'development'
    ],
    plugins: [
        [
            '@semantic-release/commit-analyzer',
            {
                releaseRules: [
                    {type: 'docs', release: 'patch'},
                    {type: 'fix', release: 'patch'},
                    {type: 'feat', release: 'minor'},
                    {type: 'perf', release: 'minor'},
                    {type: 'refactor', release: 'minor'},
                    {type: 'style', release: 'patch'},
                    {type: 'test', release: 'patch'},
                    {type: 'chore', release: 'patch'},
                    {type: 'build', release: 'patch'},
                    {type: 'ci', release: 'patch'}
                ]
            }
        ],
        '@semantic-release/release-notes-generator',
        [
            '@semantic-release/changelog',
            {
                changelogFile: 'CHANGELOG.md'
            }
        ],
        [
            '@semantic-release/npm',
            {
                npmPublish: false
            }
        ],
        [
            '@semantic-release/git',
            {
                assets: [
                    'package.json',
                    'package-lock.json',
                    'CHANGELOG.md'
                ],
                message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
            }
        ],
        [
            '@semantic-release/github',
            {
                assets: [
                    {
                        path: 'dist/**/*',
                        label: 'Distribution files'
                    }
                ]
            }
        ]
    ]
};