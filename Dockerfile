FROM busybox:1.37.0

COPY entrypoint.sh /entrypoint.sh
RUN chmod 0555 /entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
