<template>
  <div class="layout">

    <div class="section" v-for="key of keys" :key="key">
      <label :for="`input-${key}`">{{ key }}:</label>
      <input @keydown.enter="submit" :id="`input-${key}`" v-if="!currentResponse[key]?.subKeys?.length"
        v-model="currentResponse[key].value" />
      <div v-for="subKey, index in currentResponse[key]?.subKeys">
        <label :for="`input-${key}-${subKey.key}`">{{ subKey.key }}:</label>
        <input :key="index" v-model.trim="subKey.value" @keydown.enter="submit" />
      </div>
      <button style="margin: 0.5rem" @click="deleteKey(key)">Delete</button>
    </div>


    <div class="section" style="border: 1px solid green">
      <label for="new">New key:</label>
      <input @keydown.enter="createNewKey" id="newKey" v-model.trim="newKey" />
      <span class="labeled-checkbox">
        <label for="subkeys">Subkeys:</label>
        <input @input="({ target: { checked } }) => checked ? subKeys = [''] : subKeys = []" id="subkeys"
          type="checkbox" v-model="isSubKeysVisible" />
      </span>
      <span v-show="isSubKeysVisible && newKey">
        <input v-for="subKey, index in subKeys" :key="index" v-model.trim="subKeys[index]"
          @input="!subKeys.filter(v => v === '')?.length && subKeys.push('')" @keydown.enter="createNewKey" />
      </span>
    </div>


    <button style="margin: auto; margin-bottom: 1rem; margin-top: 1rem; width: 100%" @click="submit">
      Submit
    </button>
    <div style="padding-left: 0.5rem">
      <div>
        Deleted keys:
        <button v-for="key of deletedKeys" @click="deletedKeys = deletedKeys.filter((k) => k !== key)">
          {{ key }}
        </button>
      </div>
      <div>
        Responses: (click on table header to see graph)
        <table>
          <tr>
            <th @click="selectedKey = key" v-for="key of [' ', 'date', ...keys]" :key="key">
              {{ key }}
            </th>
          </tr>
          <tr v-for="response of responses" :key="response.date">
            <td v-for="key of ['delete', 'date', ...keys]" :key="key">
              <button v-if="key === 'delete'" style="font-size: 0.5rem;  margin: 0; padding: 0.25rem"
                @click="responses = responses.filter((r) => r !== response)">
                Delete
              </button>
              <span v-else>
                <span v-if="response[key]?.value"> {{ response[key]?.value }} </span>
                <span v-for="r in response[key]?.subKeys">
                  {{ r.value && `${r.key}: ${r.value} ` }}
                </span>
              </span>
            </td>
          </tr>
        </table>
      </div>
      <div>
        <button class="bad-button" @click="
      responses = [];
    deletedKeys = [];
    ">
          Clear all
        </button>
        <apexchart v-show="selectedKey" :options="options" :series="series" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
let options = ref({
  chart: {
    id: "line-graph",
  },
  xaxis: {
    categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998],
  },
});
let series = ref([
  {
    name: "series-1",
    data: [30, 40, 35, 50, 49, 60, 70, 91],
  },
]);

const selectedKey = ref("");

const getTemplateResponse = () => {
  const allKeys = responses.value.flatMap((response) => Object.keys(response));
  let templateResponse: any = {};
  for (const key of allKeys) {
    if (ignoreKeys.value.includes(key)) {
      continue;
    }

    const fullKeyResponse = [...responses.value.flatMap((response) => response[key])][0];

    templateResponse[key] = { key, value: '', subKeys: fullKeyResponse.subKeys?.flatMap((subKey: any) => ({ key: subKey.key, value: '' })) }


    templateResponse[key]?.subKeys?.length ?
      delete templateResponse[key].value :
      delete templateResponse[key]?.subKeys;
  }

  return templateResponse;
};

const subKeys = ref([]);
const isSubKeysVisible = ref(false);
const newKey = ref("");
const responses = useLocalStorage<Array<any>>("responses", []);
const deletedKeys = useLocalStorage<Array<string>>("deletedKeys", []);
const metaKeys = ["date"];
const ignoreKeys = computed(() => [...deletedKeys.value, ...metaKeys])
const currentResponse = ref(getTemplateResponse());
const keys = computed(() =>
  Object.keys(currentResponse.value).filter((key) => !ignoreKeys.value.includes(key))
);

const submit = () => {
  const strippedResponse = Object.fromEntries(
    Object.entries(currentResponse.value).filter(([_key, value]) => value)
  );

  if (Object.keys(strippedResponse)?.length === 0) {
    return;
  }

  strippedResponse.date = new Date().toLocaleString();
  strippedResponse?.subKeys?.length ?
    delete strippedResponse.value :
    delete strippedResponse.subKeys;

  responses.value.unshift(strippedResponse);
  currentResponse.value = getTemplateResponse();
};

const deleteKey = (key: string) => {
  deletedKeys.value.push(key);
};

const createNewKey = () => {
  if (newKey.value) {
    const strip = (v: string) => v.toLowerCase().trim().replace(/\s+/g, " ");
    const strippedKey = strip(newKey.value);
    const strippedSubKeys = subKeys.value.filter((v) => v).map(strip).map(key => ({ key, value: '' }));


    currentResponse.value[strippedKey] = strippedSubKeys.length ? { key: strippedKey, subKeys: strippedSubKeys } : { key: strippedKey, subKeys: strippedSubKeys };
    deletedKeys.value = deletedKeys.value.filter((key) => key !== newKey.value);
    newKey.value = "";
    subKeys.value = [];
  }
};

watch([selectedKey, () => responses.value?.length], () => {
  if (!selectedKey.value || selectedKey.value === 'date') {
    selectedKey.value = "";
    return;
  }

  const rawValues = responses.value.flatMap((response) => ({ ...response[selectedKey.value], date: response.date }));

  const removeEmpty = (v) => {
    if (!v || !Array.isArray(v)) return []
    return v.filter((v) => !!v.value && parseInt(v.value))
  }

  const subKeyValues = removeEmpty(rawValues?.flatMap((v) => [...(v?.subKeys || [])?.map((subKey) => ({ ...subKey || {}, date: v.date }))]))
  const singleValues = removeEmpty(rawValues?.filter((v) => !v.subKeys?.length))

  const values = subKeyValues.length ? subKeyValues.toReversed() : singleValues.toReversed();
  if (!values?.length) {
    selectedKey.value = "";
    return
  };



  options.value = {
    chart: { id: 'line-graph' },
    xaxis: { categories: values.map((value) => value.date) },
  };

  series.value = []
  console.log('values', values)
  const chunks = {}
  for (const value of values) {
    if (!chunks[value.key]) {
      chunks[value.key] = []
    }
    chunks[value.key].push(value.value || -1)
  }

  series.value = Object.entries(chunks).map(([key, value]) => ({ name: key, data: value }))

  console.log('chunks', chunks)

  const newSeries = values.map(
    (value) => value.value
  );


  console.log('new', newSeries)







});
</script>

<style>
.layout {
  border: 1px solid black;
  border-radius: 0.5rem;
}

@media screen and (min-width: 700px) {
  .layout {
    max-width: 70dvw;
    margin: 3rem auto;
    padding: 1rem;
  }
}

.section {
  display: flex;
}

.section label {
  width: 6rem;
  text-transform: capitalize;
  overflow: hidden;
  text-overflow: ellipsis;
}

.section input {
  flex: 1;
}

input {
  padding: 0.25rem;
  margin: 0.5rem;
  height: 2.25rem;
}

label {
  padding: 0.5rem;
  margin: 0.5rem;
}

.bad-button {
  background-color: red;
  color: white;
}

table {
  border-collapse: collapse;
  width: 100%;
}

table th {
  background-color: #f2f2f2;
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
  cursor: pointer;
}

table td {
  border: 1px solid #ddd;
  padding: 0.25rem 0 0.25rem 0.25rem;
}

table tr:nth-child(even) {
  background-color: #f2f2f2;
}

table tr:hover {
  background-color: #ddd;
}

.labeled-checkbox {
  display: flex;
  align-items: center;
  justify-content: start;
  margin: 0.5rem;
}

.labeled-checkbox label {
  margin: 0;
  padding: 0;
}

.labeled-checkbox input {
  transform: scale(3);
}
</style>
