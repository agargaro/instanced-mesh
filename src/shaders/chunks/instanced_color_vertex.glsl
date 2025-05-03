#ifdef USE_INSTANCING_COLOR_INDIRECT
  #ifdef USE_VERTEX_COLOR
    vColor = color;
  #else
    #ifdef USE_COLOR_ALPHA
      vColor = vec4( 1.0 );
    #else
      vColor = vec3( 1.0 );
    #endif
  #endif
#endif
