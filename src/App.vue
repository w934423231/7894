<template>
  <div id="app" class="content">
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
.joint-conainer{
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: center;
    align-content: stretch;
    align-items: center;
    padding: 10px;
    width: 98vw;
    height: 100vh;
    overflow: hidden;
}
#paper{
  width: 100%;
  height: 100%;
  outline: 1px dashed #00fa00;
  overflow: hidden;
}
</style>
