(() => {
  'use strict'
  var e = {
    37: e => {
      e.exports = require('mongoose')
    }, 64: function(e, t, r) {
      var o = this && this.__decorate || function(e, t, r, o) {
        var i, s = arguments.length, n = s < 3 ? t : null === o ? o = Object.getOwnPropertyDescriptor(t, r) : o
        if ('object' == typeof Reflect && 'function' == typeof Reflect.decorate) n = Reflect.decorate(e, t, r, o) else for (var a = e.length - 1; a >= 0; a--) (i = e[a]) && (n = (s < 3 ? i(n) : s > 3 ? i(t, r, n) : i(t, r)) || n)
        return s > 3 && n && Object.defineProperty(t, r, n), n
      }, i = this && this.__metadata || function(e, t) {
        if ('object' == typeof Reflect && 'function' == typeof Reflect.metadata) return Reflect.metadata(e, t)
      }
      Object.defineProperty(t, '__esModule', { value: !0 }), t.fhirResourceSchema = t.FhirResource = void 0
      const s = r(839)
      let n = class {
        resourceType
        id
        meta
        resource
        status
        tags
        searchParams
      }
      t.FhirResource = n, o([(0, s.Prop)({
        required: !0, index: !0,
      }), i('design:type', String)], n.prototype, 'resourceType', void 0), o([(0, s.Prop)({
        required: !0, unique: !0, index: !0,
      }), i('design:type', String)], n.prototype, 'id', void 0), o([(0, s.Prop)({
        type: Object, default: () => ({ versionId: '1', lastUpdated: new Date, profile: [] }),
      }), i('design:type', Object)], n.prototype, 'meta', void 0), o([(0, s.Prop)({ type: Object }), i('design:type', Object)], n.prototype, 'resource', void 0), o([(0, s.Prop)({
        default: 'active', index: !0,
      }), i('design:type', String)], n.prototype, 'status', void 0), o([(0, s.Prop)({
        type: [String], default: [],
      }), i('design:type', Array)], n.prototype, 'tags', void 0), o([(0, s.Prop)({
        type: Object, default: {},
      }), i('design:type', Object)], n.prototype, 'searchParams', void 0), t.FhirResource = n = o([(0, s.Schema)({
        collection: 'resources',
        timestamps: { createdAt: 'meta.lastUpdated', updatedAt: !1 },
        strict: !1,
        versionKey: !1,
      })], n), t.fhirResourceSchema = s.SchemaFactory.createForClass(n), t.fhirResourceSchema.index({
        resourceType: 1, id: 1,
      }), t.fhirResourceSchema.index({
        resourceType: 1, status: 1,
      }), t.fhirResourceSchema.index({ 'meta.lastUpdated': -1 })
    }, 173: function(e, t, r) {
      var o = this && this.__decorate || function(e, t, r, o) {
        var i, s = arguments.length, n = s < 3 ? t : null === o ? o = Object.getOwnPropertyDescriptor(t, r) : o
        if ('object' == typeof Reflect && 'function' == typeof Reflect.decorate) n = Reflect.decorate(e, t, r, o) else for (var a = e.length - 1; a >= 0; a--) (i = e[a]) && (n = (s < 3 ? i(n) : s > 3 ? i(t, r, n) : i(t, r)) || n)
        return s > 3 && n && Object.defineProperty(t, r, n), n
      }, i = this && this.__metadata || function(e, t) {
        if ('object' == typeof Reflect && 'function' == typeof Reflect.metadata) return Reflect.metadata(e, t)
      }
      Object.defineProperty(t, '__esModule', { value: !0 }), t.structureDefinitionSchema = t.StructureDefinition = void 0
      const s = r(839)
      let n = class {
        resourceType
        url
        release
        definition
      }
      t.StructureDefinition = n, o([(0, s.Prop)({
        required: !0, index: !0,
      }), i('design:type', String)], n.prototype, 'resourceType', void 0), o([(0, s.Prop)({
        required: !0, unique: !0, index: !0,
      }), i('design:type', String)], n.prototype, 'url', void 0), o([(0, s.Prop)({
        required: !0, default: '4', index: !0,
      }), i('design:type', Number)], n.prototype, 'release', void 0), o([(0, s.Prop)({ type: Object }), i('design:type', Object)], n.prototype, 'definition', void 0), t.StructureDefinition = n = o([(0, s.Schema)({
        collection: 'structure-definitions', timestamps: { createdAt: !0, updatedAt: !1 }, strict: !1, versionKey: !1,
      })], n), t.structureDefinitionSchema = s.SchemaFactory.createForClass(n), t.structureDefinitionSchema.index({
        resourceType: 1, url: 1, release: 1,
      })
    }, 187: function(e, t, r) {
      var o = this && this.__decorate || function(e, t, r, o) {
        var i, s = arguments.length, n = s < 3 ? t : null === o ? o = Object.getOwnPropertyDescriptor(t, r) : o
        if ('object' == typeof Reflect && 'function' == typeof Reflect.decorate) n = Reflect.decorate(e, t, r, o) else for (var a = e.length - 1; a >= 0; a--) (i = e[a]) && (n = (s < 3 ? i(n) : s > 3 ? i(t, r, n) : i(t, r)) || n)
        return s > 3 && n && Object.defineProperty(t, r, n), n
      }, i = this && this.__metadata || function(e, t) {
        if ('object' == typeof Reflect && 'function' == typeof Reflect.metadata) return Reflect.metadata(e, t)
      }, s = this && this.__param || function(e, t) {
        return function(r, o) {
          t(r, o, e)
        }
      }
      Object.defineProperty(t, '__esModule', { value: !0 }), t.ValidationService = void 0
      const n = r(563), a = r(173), c = r(37), u = r(839), d = r(696)
      let p = class {
        structureDefinitionModel
        skippedElements = []

        constructor(e) {
          this.structureDefinitionModel = e
        }

        async validateResource(e) {
          const t = e.resourceType
          if (!t) return {
            isValid: !1, errors: [{
              path: 'resourceType',
              message: 'Resource should contain a resourceType property',
              severity: 'error',
              code: 'required',
            }], warnings: [],
          }
          const r = await this.getStructureDefinition(t, e?.profile)
          return r ? this.validateAgainstStructureDefinition(e, r) : {
            isValid: !1, errors: [{
              path: 'resourceType',
              message: `No structure definition for resource type: ${t}`,
              severity: 'error',
              code: 'unknown-resource-type',
            }], warnings: [],
          }
        }

        async getStructureDefinition(e, t) {
          const r = { resourceType: e }
          return t && Object.assign(r, { url: Array.isArray(t) ? (0, d.first)(t) : t }), this.structureDefinitionModel.findOne(r).exec()
        }

        validateAgainstStructureDefinition(e, t) {
          this.skippedElements = []
          const r = [], o = []
          try {
            const i = t.definition
            if (!i || !i.snapshot || !i.snapshot.element) throw new Error('Illegal structure definition format')
            const s = i.snapshot.element
            for (const t of s) {
              const o = t.path
              this.validateElement(e, o, t, r)
            }
            return { isValid: 0 === r.length, errors: r, warnings: o }
          } catch (e) {
            return {
              isValid: !1, errors: [{
                path: 'root', message: `Validatie errer: ${e.message}`, severity: 'error', code: 'validation-error',
              }], warnings: o,
            }
          }
        }

        validateElement(e, t, r, o) {
          const i = t.split('.')
          if (1 === i.length) return
          if (this.getParentElementPath(t) && this.checkAnchestor(t)) return
          const s = i.slice(1).join('.'), n = this.getValueByPath(e, s)
          if (r.min && r.min > 0 && null == n) o.push({
            path: s, message: `Required property '${s}' is missing`, severity: 'error', code: 'required',
          }) else if ('0' !== r.max || void 0 === n) if (null != n) {
            if (r.max && '*' !== r.max) {
              const e = parseInt(r.max)
              Array.isArray(n) && n.length > e && o.push({
                path: s,
                message: `To many values for '${s}'. Maximum: ${e}, found: ${n.length}`,
                severity: 'error',
                code: 'cardinality',
              })
            }
            if (r.type && r.type.length > 0) {
              const e = this.validateDataType(n, r.type, s)
              e.isValid || o.push({ path: s, message: e.message, severity: 'error', code: 'type-mismatch' })
            }
            r.fixedString && n !== r.fixedString && o.push({
              path: s,
              message: `property '${s}' must have the value of '${r.fixedString}'`,
              severity: 'error',
              code: 'fixed-value',
            }), r.patternString && 'string' == typeof n && (new RegExp(r.patternString).test(n) || o.push({
              path: s,
              message: `Property '${s}' does not match the expected pattern`,
              severity: 'error',
              code: 'pattern',
            }))
          } else 0 === r.min && -1 === this.skippedElements.indexOf(t) && this.skippedElements.push(t) else o.push({
            path: s, message: `property '${s}' is not allowed`, severity: 'error', code: 'forbidden',
          })
        }

        getValueByPath(e, t) {
          return t.split('.').reduce((e, t) => e && void 0 !== e[t] ? e[t] : void 0, e)
        }

        validateDataType(e, t, r) {
          const o = t.map(e => e.code)
          for (const t of o) {
            if (Array.isArray(e)) return e.forEach(e => {
              if (!this.isValidType(e, t)) return {
                isValid: !1, message: 'Not each entry of this given array matches the requested type',
              }
            }), { isValid: !0, message: '' }
            if (this.isValidType(e, t)) return { isValid: !0, message: '' }
          }
          return { isValid: !1, message: `Property '${r}' has an invalid type. Expected: ${o.join(' or ')}` }
        }

        isValidType(e, t) {
          switch (t) {
            case'string':
            case'http://hl7.org/fhirpath/System.String':
              return 'string' == typeof e
            case'boolean':
              return 'boolean' == typeof e
            case'integer':
              return Number.isInteger(e)
            case'decimal':
              return 'number' == typeof e
            case'uri':
              return 'string' == typeof e && this.isValidUri(e)
            case'url':
              return 'string' == typeof e && this.isValidUrl(e)
            case'code':
              return 'string' == typeof e && e.length > 0
            case'id':
              return 'string' == typeof e && /^[A-Za-z0-9\-.]{1,64}$/.test(e)
            case'dateTime':
              return 'string' == typeof e && this.isValidDateTime(e)
            case'date':
              return 'string' == typeof e && this.isValidDate(e)
            default:
              return 'object' == typeof e && null !== e
          }
        }

        isValidUri(e) {
          try {
            return new URL(e), !0
          } catch {
            return /^[a-zA-Z][a-zA-Z0-9+.-]*:.+/.test(e)
          }
        }

        isValidUrl(e) {
          try {
            return new URL(e), !0
          } catch {
            return !1
          }
        }

        isValidDateTime(e) {
          return /^\d{4}(-\d{2}(-\d{2}(T\d{2}(:\d{2}(:\d{2}(\.\d+)?)?)?(Z|[+-]\d{2}:\d{2})?)?)?)?$/.test(e)
        }

        isValidDate(e) {
          return /^\d{4}(-\d{2}(-\d{2})?)?$/.test(e)
        }

        async validateResourceOrThrow(e) {
          const t = await this.validateResource(e)
          if (!t.isValid) throw t.errors.map(e => `${e.path}: ${e.message}`), new n.BadRequestException({
            message: 'Resource validation failed', errors: t.errors, warnings: t.warnings,
          })
        }

        getParentElementPath(e) {
          const t = e.split('.')
          return t.length <= 2 ? null : t.slice(0, -1).join('.')
        }

        checkAnchestor(e) {
          const t = this.getParentElementPath(e)
          if (t && -1 !== this.skippedElements.indexOf(t)) return !0
          if (t) {
            const e = this.getParentElementPath(t)
            if (e && this.skippedElements.indexOf(e)) return !0
          }
          return !1
        }
      }
      t.ValidationService = p, t.ValidationService = p = o([(0, n.Injectable)(), s(0, (0, u.InjectModel)(a.StructureDefinition.name)), i('design:paramtypes', [c.Model])], p)
    }, 205: function(e, t, r) {
      var o = this && this.__decorate || function(e, t, r, o) {
        var i, s = arguments.length, n = s < 3 ? t : null === o ? o = Object.getOwnPropertyDescriptor(t, r) : o
        if ('object' == typeof Reflect && 'function' == typeof Reflect.decorate) n = Reflect.decorate(e, t, r, o) else for (var a = e.length - 1; a >= 0; a--) (i = e[a]) && (n = (s < 3 ? i(n) : s > 3 ? i(t, r, n) : i(t, r)) || n)
        return s > 3 && n && Object.defineProperty(t, r, n), n
      }
      Object.defineProperty(t, '__esModule', { value: !0 }), t.AppModule = void 0
      const i = r(563), s = r(509), n = r(918), a = r(765), c = r(599), u = r(839), d = r(64), p = r(173), l = r(187)
      let f = class {
      }
      t.AppModule = f, t.AppModule = f = o([(0, i.Module)({
        imports: [u.MongooseModule.forRoot('mongodb://localhost:27017/fhir-server', {
          maxPoolSize: 10, serverSelectionTimeoutMS: 5e3, socketTimeoutMS: 45e3, bufferCommands: !1,
        }), u.MongooseModule.forFeature([{
          name: d.FhirResource.name, schema: d.fhirResourceSchema,
        }, { name: p.StructureDefinition.name, schema: p.structureDefinitionSchema }])],
        controllers: [s.AppController, a.FhirController],
        providers: [n.AppService, c.FhirService, l.ValidationService],
        exports: [u.MongooseModule],
      })], f)
    }, 208: (e, t, r) => {
      Object.defineProperty(t, '__esModule', { value: !0 }), t.DeleteOperation = void 0
      const o = r(563), i = r(710)

      class s extends i.Operation {
        constructor(e) {
          super(e), this.fhirResourceModel = e
        }

        async execute(e, t) {
          try {
            const r = await this.exists(e, t)
            if (!r) throw new o.NotFoundException({
              resourceType: 'OperationOutcome', issue: [{
                severity: 'error', code: 'not-found', details: { text: `${e}/${t} not found or already deleted` },
              }],
            })
            if (!await this.updateResource(e, t, r)) throw new Error('Failed to delete resource')
            return {
              resourceType: 'OperationOutcome',
              issue: [{ severity: 'information', code: 'deleted', details: { text: `${e}/${t} has been deleted` } }],
            }
          } catch (r) {
            if (r instanceof o.NotFoundException) throw r
            throw new Error(`Error deleting ${e}/${t}: ${r.message}`)
          }
        }

        async updateResource(e, t, r) {
          return this.fhirResourceModel.findOneAndUpdate({
            resourceType: e, id: t, status: 'active',
          }, {
            $set: {
              status: 'inactive',
              'meta.versionId': String(parseInt(r.meta?.versionId ?? 0) + 1),
              'meta.lastUpdated': new Date,
            }, $push: { tags: 'deleted' },
          }, { new: !0 })
        }
      }

      t.DeleteOperation = s
    }, 366: (e, t, r) => {
      Object.defineProperty(t, '__esModule', { value: !0 }), t.UpdateOperation = void 0
      const o = r(710), i = r(563), s = r(455)

      class n extends o.Operation {
        constructor(e) {
          super(e), this.fhirResourceModel = e
        }

        async execute(e, t, r) {
          const o = await this.exists(e, t)
          if (o) {
            if (r.meta?.versionId && r.meta.versionId !== o.meta.versionId) throw new i.ConflictException({
              resourceType: 'OperationOutcome', issue: [{
                severity: 'error',
                code: 'conflict',
                details: { text: `Version conflict. Expected version ${o.meta.versionId}, but received ${r.meta.versionId}` },
              }],
            })
            const n = String(parseInt(o.meta.versionId) + 1), a = this.prepareResourceForUpdate(e, t, r, o, n),
              c = this.extractSearchParams(e, a), u = await this.fhirResourceModel.findOneAndUpdate({
                resourceType: e, id: t, status: 'active',
              }, { $set: { resource: a, 'meta.versionId': n, 'meta.lastUpdated': new Date, searchParams: c } }, {
                new: !0, runValidators: !0,
              })
            if (!u) throw new Error('Failed to update resource')
            return s.FhirResponse.format(u)
          }
          throw new i.NotFoundException({
            resourceType: 'OperationOutcome', issue: [{
              severity: 'error',
              code: 'not-found',
              details: { text: `${e}/${t} can not be updated, cos it does not exists` },
            }],
          })
        }

        prepareResourceForUpdate(e, t, r, o, i) {
          return {
            ...r, resourceType: e, id: t, meta: {
              versionId: i,
              lastUpdated: (new Date).toISOString(),
              profile: r.meta?.profile || o.meta.profile || [],
              security: r.meta?.security || o.meta.security || [],
              tag: r.meta?.tag || o.meta.tag || [],
            },
          }
        }
      }

      t.UpdateOperation = n
    }, 443: (e, t, r) => {
      Object.defineProperty(t, '__esModule', { value: !0 }), t.CreateOperation = void 0
      const o = r(710), i = r(903), s = r(455), n = r(563)

      class a extends o.Operation {
        constructor(e) {
          super(e), this.fhirResourceModel = e
        }

        async execute(e, t) {
          const r = 'string' == typeof t.id ? t.id : (0, i.v4)()
          if (await this.exists(e, r)) throw new n.NotAcceptableException({
            resourceType: 'OperationOutcome', issue: [{
              severity: 'error', code: 'Resource already exists', details: { text: `${e}/${r} already deleted` },
            }],
          })
          {
            t.id = r
            const o = new this.fhirResourceModel({
              resourceType: e,
              id: r,
              resource: { resourceType: e, id: r, ...t },
              meta: { versionId: '1', lastUpdated: new Date },
              tags: ['tenant'],
              searchParams: this.extractSearchParams(e, t),
            }), i = await o.save()
            return s.FhirResponse.format(i)
          }
        }
      }

      t.CreateOperation = a
    }, 455: (e, t, r) => {
      Object.defineProperty(t, '__esModule', { value: !0 }), t.FhirResponse = void 0
      const o = r(903)

      class i {
        static format(e) {
          return { ...e.resource, meta: e.meta }
        }

        static notFound(e) {
          return {
            resourceType: 'OperationOutcome',
            issue: [{ severity: 'error', code: 'not-found', details: { text: `${e}` } }],
          }
        }

        static notAcceptatble(e) {
          return {
            resourceType: 'OperationOutcome',
            issue: [{ severity: 'error', code: 'not-accaptable', details: { text: `${e}` } }],
          }
        }

        static bundle(e, t, r, s = 0, n = 20) {
          return {
            resourceType: 'Bundle',
            id: (0, o.v4)(),
            type: 'searchset',
            total: t,
            link: [{ relation: 'self', url: `${r}?_offset=${s}&_count=${n}` }, ...s + n < t ? [{
              relation: 'next', url: `${r}?_offset=${s + n}&_count=${n}`,
            }] : [], ...s > 0 ? [{ relation: 'previous', url: `${r}?_offset=${Math.max(0, s - n)}&_count=${n}` }] : []],
            entry: e.map(e => ({ fullUrl: `${r}/${e.id}`, resource: i.format(e), search: { mode: 'match' } })),
          }
        }
      }

      t.FhirResponse = i
    }, 503: (e, t, r) => {
      Object.defineProperty(t, '__esModule', { value: !0 }), t.SearchOperation = void 0
      const o = r(710), i = r(563), s = r(455)

      class n extends o.Operation {
        constructor(e) {
          super(e), this.fhirResourceModel = e
        }

        async findById(e, t) {
          const r = await this.fhirResourceModel.findOne({ resourceType: e, id: t, status: 'active' }).exec()
          if (!r) throw new i.NotFoundException({
            resourceType: 'OperationOutcome',
            issue: [{ severity: 'error', code: 'not-found', details: { text: `${e}/${t} not found` } }],
          })
          return s.FhirResponse.format(r)
        }

        async find(e, t) {
          const r = { resourceType: e, status: 'active' }
          Object.keys(t).forEach(e => {
            '_count' !== e && '_offset' !== e && '_sort' !== e && (r[`searchParams.${e}`] = t[e])
          })
          const o = parseInt(t._count) || 20, i = parseInt(t._offset) || 0
          let n = { 'meta.lastUpdated': -1 }
          if (t._sort) {
            const e = t._sort.startsWith('-') ? t._sort.substring(1) : t._sort, r = t._sort.startsWith('-') ? -1 : 1
            n = { [`searchParams.${e}`]: r }
          }
          const a = await this.fhirResourceModel.find(r).skip(i).limit(o).sort(n).exec(),
            c = await this.fhirResourceModel.countDocuments(r)
          return s.FhirResponse.bundle(a, c, e, i, o)
        }
      }

      t.SearchOperation = n
    }, 509: function(e, t, r) {
      var o = this && this.__decorate || function(e, t, r, o) {
        var i, s = arguments.length, n = s < 3 ? t : null === o ? o = Object.getOwnPropertyDescriptor(t, r) : o
        if ('object' == typeof Reflect && 'function' == typeof Reflect.decorate) n = Reflect.decorate(e, t, r, o) else for (var a = e.length - 1; a >= 0; a--) (i = e[a]) && (n = (s < 3 ? i(n) : s > 3 ? i(t, r, n) : i(t, r)) || n)
        return s > 3 && n && Object.defineProperty(t, r, n), n
      }, i = this && this.__metadata || function(e, t) {
        if ('object' == typeof Reflect && 'function' == typeof Reflect.metadata) return Reflect.metadata(e, t)
      }
      Object.defineProperty(t, '__esModule', { value: !0 }), t.AppController = void 0
      const s = r(563), n = r(918), a = r(742)
      let c = class {
        appService

        constructor(e) {
          this.appService = e
        }

        version() {
          return 'Fhir 4.0.0'
        }

        healthcheck() {
          return 'ok'
        }
      }
      t.AppController = c, o([(0, s.Get)(), i('design:type', Function), i('design:paramtypes', []), i('design:returntype', String)], c.prototype, 'version', null), o([(0, s.Get)('readiness'), i('design:type', Function), i('design:paramtypes', []), i('design:returntype', String)], c.prototype, 'healthcheck', null), t.AppController = c = o([(0, a.ApiTags)('Health Check'), (0, s.Controller)(), i('design:paramtypes', [n.AppService])], c)
    }, 563: e => {
      e.exports = require('@nestjs/common')
    }, 599: function(e, t, r) {
      var o = this && this.__decorate || function(e, t, r, o) {
        var i, s = arguments.length, n = s < 3 ? t : null === o ? o = Object.getOwnPropertyDescriptor(t, r) : o
        if ('object' == typeof Reflect && 'function' == typeof Reflect.decorate) n = Reflect.decorate(e, t, r, o) else for (var a = e.length - 1; a >= 0; a--) (i = e[a]) && (n = (s < 3 ? i(n) : s > 3 ? i(t, r, n) : i(t, r)) || n)
        return s > 3 && n && Object.defineProperty(t, r, n), n
      }, i = this && this.__metadata || function(e, t) {
        if ('object' == typeof Reflect && 'function' == typeof Reflect.metadata) return Reflect.metadata(e, t)
      }, s = this && this.__param || function(e, t) {
        return function(r, o) {
          t(r, o, e)
        }
      }
      Object.defineProperty(t, '__esModule', { value: !0 }), t.FhirService = void 0
      const n = r(563), a = r(64), c = r(37), u = r(839), d = r(455), p = r(208), l = r(443), f = r(366), h = r(503),
        y = r(187), m = r(173), g = r(783)
      let v = class {
        fhirResourceModel
        structureDefinitonModel
        validationService

        constructor(e, t, r) {
          this.fhirResourceModel = e, this.structureDefinitonModel = t, this.validationService = r
        }

        async findById(e, t) {
          try {
            const r = new h.SearchOperation(this.fhirResourceModel)
            return await r.findById(e, t)
          } catch (r) {
            if (r instanceof n.NotFoundException) throw r
            throw new Error(`Error retrieving ${e}/${t}: ${r.message}`)
          }
        }

        async find(e, t) {
          try {
            return new h.SearchOperation(this.fhirResourceModel).find(e, t)
          } catch (t) {
            throw new Error(`Error searching ${e}: ${t.message}`)
          }
        }

        async create(e, t) {
          await this.validationService.validateResourceOrThrow(t)
          try {
            return new l.CreateOperation(this.fhirResourceModel).execute(e, t)
          } catch (t) {
            if (t instanceof n.NotAcceptableException) return d.FhirResponse.notAcceptatble(t.message)
            throw new Error(`Error creating ${e}: ${t.message}`)
          }
        }

        async update(e, t, r) {
          await this.validationService.validateResourceOrThrow(r)
          try {
            return new f.UpdateOperation(this.fhirResourceModel).execute(e, t, r)
          } catch (r) {
            if (r instanceof n.NotFoundException || r instanceof n.BadRequestException || r instanceof n.ConflictException) throw r
            throw new Error(`Error updating ${e}/${t}: ${r.message}`)
          }
        }

        async delete(e, t) {
          try {
            return new p.DeleteOperation(this.fhirResourceModel).execute(e, t)
          } catch (r) {
            if (r instanceof n.NotFoundException) return d.FhirResponse.notFound(r.message)
            throw new Error(`Error deleting ${e}/${t}: ${r.message}`)
          }
        }

        async getMetaData() {
          const e = await this.structureDefinitonModel.distinct('resourceType').exec()
          return (new g.Metadata).get(e)
        }

        async checkPreRequest(e, t, r, o) {
          if ('POST' === e) {
            if (r?.resourceType !== t) throw new n.BadRequestException(`ResourceType (${t}) in the URL does not match the ResourceType in the request body (${r.resourceType})`)
          } else {
            if ('PUT' !== e) throw new n.BadRequestException(`Unsupported HTTP method: ${e}`)
            if (!o) throw new n.BadRequestException('ID is required for PUT operation')
            if (r?.id !== o) throw new n.BadRequestException(`ID in the URL (${o}) does not match the ID in the request body. (${r.id}`)
            if (r?.resourceType !== t) throw new n.BadRequestException(`ResourceType (${t}) in the URL does not match the ResourceType in the request body (${r.resourceType})`)
          }
        }
      }
      t.FhirService = v, t.FhirService = v = o([(0, n.Injectable)(), s(0, (0, u.InjectModel)(a.FhirResource.name)), s(1, (0, u.InjectModel)(m.StructureDefinition.name)), i('design:paramtypes', [c.Model, c.Model, y.ValidationService])], v)
    }, 696: e => {
      e.exports = require('lodash-es')
    }, 710: (e, t) => {
      Object.defineProperty(t, '__esModule', { value: !0 }), t.Operation = void 0, t.Operation = class {
        fhirResourceModel

        constructor(e) {
          this.fhirResourceModel = e
        }

        async exists(e, t) {
          return await this.fhirResourceModel.findOne({ resourceType: e, id: t, status: 'active' })
        }

        extractSearchParams(e, t) {
          const r = {}
          switch (e) {
            case'Patient':
              t.name && (r.name = t.name[0]?.family || t.name[0]?.given?.join(' ')), t.gender && (r.gender = t.gender), t.birthDate && (r.birthdate = t.birthDate)
              break
            case'Observation':
              t.subject && (r.patient = t.subject.reference), t.code && (r.code = t.code.coding?.[0]?.code), t.effectiveDateTime && (r.date = t.effectiveDateTime)
              break
            default:
              t.id && (r._id = t.id)
          }
          return r
        }
      }
    }, 742: e => {
      e.exports = require('@nestjs/swagger')
    }, 765: function(e, t, r) {
      var o = this && this.__decorate || function(e, t, r, o) {
        var i, s = arguments.length, n = s < 3 ? t : null === o ? o = Object.getOwnPropertyDescriptor(t, r) : o
        if ('object' == typeof Reflect && 'function' == typeof Reflect.decorate) n = Reflect.decorate(e, t, r, o) else for (var a = e.length - 1; a >= 0; a--) (i = e[a]) && (n = (s < 3 ? i(n) : s > 3 ? i(t, r, n) : i(t, r)) || n)
        return s > 3 && n && Object.defineProperty(t, r, n), n
      }, i = this && this.__metadata || function(e, t) {
        if ('object' == typeof Reflect && 'function' == typeof Reflect.metadata) return Reflect.metadata(e, t)
      }, s = this && this.__param || function(e, t) {
        return function(r, o) {
          t(r, o, e)
        }
      }
      Object.defineProperty(t, '__esModule', { value: !0 }), t.FhirController = void 0
      const n = r(563), a = r(599), c = r(742)
      let u = class {
        _service

        constructor(e) {
          this._service = e
        }

        getCapabilityStatement() {
          return this._service.getMetaData()
        }

        async searchResources(e, t) {
          return this._service.find(e, t)
        }

        async getResource(e, t) {
          return this._service.findById(e, t)
        }

        async createResource(e, t) {
          return await this._service.checkPreRequest('POST', e, t), this._service.create(e, t)
        }

        async update(e, t, r) {
          return await this._service.checkPreRequest('POST', e, r, t), this._service.update(e, t, r)
        }

        delete(e, t) {
          return this._service.delete(e, t)
        }
      }
      t.FhirController = u, o([(0, n.Get)('metadata'), i('design:type', Function), i('design:paramtypes', []), i('design:returntype', Object)], u.prototype, 'getCapabilityStatement', null), o([(0, n.Get)(':resourceType'), s(0, (0, n.Param)('resourceType')), s(1, (0, n.Query)()), i('design:type', Function), i('design:paramtypes', [String, Object]), i('design:returntype', Promise)], u.prototype, 'searchResources', null), o([(0, n.Get)(':resourceType/:id'), s(0, (0, n.Param)('resourceType')), s(1, (0, n.Param)('id')), i('design:type', Function), i('design:paramtypes', [String, String]), i('design:returntype', Promise)], u.prototype, 'getResource', null), o([(0, n.Post)(':resourceType'), s(0, (0, n.Param)('resourceType')), s(1, (0, n.Body)()), i('design:type', Function), i('design:paramtypes', [String, Object]), i('design:returntype', Promise)], u.prototype, 'createResource', null), o([(0, n.Put)(':resourceType/:id'), s(0, (0, n.Param)('resourceType')), s(1, (0, n.Param)('id')), s(2, (0, n.Body)()), i('design:type', Function), i('design:paramtypes', [String, String, Object]), i('design:returntype', Promise)], u.prototype, 'update', null), o([(0, n.Delete)(':resourceType/:id'), s(0, (0, n.Param)('resourceType')), s(1, (0, n.Param)('id')), i('design:type', Function), i('design:paramtypes', [String, String]), i('design:returntype', Promise)], u.prototype, 'delete', null), t.FhirController = u = o([(0, c.ApiTags)('Fhir Server'), (0, n.Controller)('fhir'), i('design:paramtypes', [a.FhirService])], u)
    }, 781: e => {
      e.exports = require('@nestjs/core')
    }, 783: (e, t) => {
      Object.defineProperty(t, '__esModule', { value: !0 }), t.Metadata = void 0, t.Metadata = class {
        constructor() {
        }

        get(e) {
          const t = {
            resourceType: 'CapabilityStatement',
            status: 'active',
            date: (new Date).toISOString(),
            kind: 'instance',
            software: { name: 'Martijn on Fhir Server', version: '1.0.0' },
            implementation: { description: 'Generic FHIR Server built with NestJS and MongoDB' },
            fhirVersion: '4.0.1',
            format: ['json'],
            rest: [{ mode: 'server', resource: [] }],
          }
          return e.forEach(e => {
            const r = {
              type: `${e}`,
              interaction: [{ code: 'read' }, { code: 'create' }, { code: 'update' }, { code: 'delete' }, { code: 'search-type' }],
            }
            t.rest[0].resource.push(r)
          }), t
        }
      }
    }, 839: e => {
      e.exports = require('@nestjs/mongoose')
    }, 903: e => {
      e.exports = require('uuid')
    }, 918: function(e, t, r) {
      var o = this && this.__decorate || function(e, t, r, o) {
        var i, s = arguments.length, n = s < 3 ? t : null === o ? o = Object.getOwnPropertyDescriptor(t, r) : o
        if ('object' == typeof Reflect && 'function' == typeof Reflect.decorate) n = Reflect.decorate(e, t, r, o) else for (var a = e.length - 1; a >= 0; a--) (i = e[a]) && (n = (s < 3 ? i(n) : s > 3 ? i(t, r, n) : i(t, r)) || n)
        return s > 3 && n && Object.defineProperty(t, r, n), n
      }
      Object.defineProperty(t, '__esModule', { value: !0 }), t.AppService = void 0
      const i = r(563)
      let s = class {
        getHello() {
          return 'Hello World!'
        }
      }
      t.AppService = s, t.AppService = s = o([(0, i.Injectable)()], s)
    }, 928: e => {
      e.exports = require('path')
    },
  }, t = {}

  function r(o) {
    var i = t[o]
    if (void 0 !== i) return i.exports
    var s = t[o] = { exports: {} }
    return e[o].call(s.exports, s, s.exports, r), s.exports
  }

  (() => {
    const e = r(781), t = r(205), o = r(742), i = r(928)
    !async function() {
      const r = await e.NestFactory.create(t.AppModule)
      r.useStaticAssets((0, i.join)(__dirname, '..', 'static'))
      const s = (new o.DocumentBuilder).setTitle('Fhir Service').setVersion('1.0').setExternalDoc('Insomnia | Postman Collection', './api-json').setContact('Martijn on Fhir', 'https://github.com/martijn-on-fhir/fhir-server', '').addServer('http://localhost:3000', 'Local Development').build(),
        n = o.SwaggerModule.createDocument(r, s)
      o.SwaggerModule.setup('api', r, n, {
        customSiteTitle: 'Fhir Server API',
        customfavIcon: './favicon.png',
        customCssUrl: ['/theme.css'],
        customJs: ['https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js', 'adapcare.js'],
      }), await r.listen(process.env.PORT ?? 3e3)
    }()
  })()
})()
